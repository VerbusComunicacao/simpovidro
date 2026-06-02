import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import registration from "models/registration.js"
import sale from "models/sale.js"
import { ValidationError, UnauthorizedError } from "infra/errors.js"
import email from "infra/email.js"
import webserver from "infra/webserver.js"
import { calculateSalePriceBreakdown, getGuestCountsString } from "lib/registration-helpers.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.post(postHandler)

export default router.handler(controller.errorHandlers)

async function postHandler(request, response) {
  const user = request.context.user
  const { guests_data } = request.body

  if (!user.id) {
    throw new UnauthorizedError({
      message: "Você precisa estar logado para realizar a inscrição.",
      action: "Faça login e tente novamente.",
    })
  }

  if (!Array.isArray(guests_data) || guests_data.length === 0) {
    throw new ValidationError({
      message: "É necessário informar pelo menos um hóspede.",
      action: "Adicione os dados do hóspede e tente novamente.",
    })
  }

  // 1. Check for duplicate guests in the same request
  const usedCPFs = new Set()
  const usedRGs = new Set()

  for (const currentGuestData of guests_data) {
    const cleanCpf = currentGuestData.cpf_number?.replace(/\D/g, "")
    const isPlaceholder =
      cleanCpf === "11111111111" || currentGuestData.is_pending_info === true

    if (!isPlaceholder) {
      if (
        currentGuestData.cpf_number &&
        usedCPFs.has(currentGuestData.cpf_number)
      ) {
        throw new ValidationError({
          message:
            "Os hóspedes informados não podem ser iguais (CPF duplicado).",
          action: "Verifique os dados dos hóspedes e tente novamente.",
        })
      }
      if (
        currentGuestData.rg_number &&
        usedRGs.has(currentGuestData.rg_number)
      ) {
        throw new ValidationError({
          message:
            "Os hóspedes informados não podem ser iguais (RG duplicado).",
          action: "Verifique os dados dos hóspedes e tente novamente.",
        })
      }
      if (currentGuestData.cpf_number) usedCPFs.add(currentGuestData.cpf_number)
      if (currentGuestData.rg_number) usedRGs.add(currentGuestData.rg_number)
    }
  }

  // 2. Delegate registration logic to model
  const registrationResult = await registration.create(user, request.body)
  const { saleId, guestIds } = registrationResult

  // 3. Send Confirmation Email
  try {
    const saleDetails = await sale.findOneByIdWithDetails(saleId)

    const formatDate = (date) => {
      if (!date) return ""
      const dateStr =
        date instanceof Date ? date.toISOString().split("T")[0] : String(date)
      const [year, month, day] = dateStr.split("T")[0].split("-")
      return `${day}/${month}/${year}`
    }
    const formatCurrency = (val) =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(val)

    // Helper to format key-value pairs cleanly
    const formatGuestDetails = (guest) => {
      const fields = [
        { label: "Crachá", value: guest.badge_name?.toUpperCase() },
        { label: "CPF", value: guest.cpf_number },
        { label: "RG", value: guest.rg_number },
        {
          label: "Nascimento",
          value: guest.birth_date ? formatDate(guest.birth_date) : null,
        },
        { label: "Email", value: guest.email },
        { label: "Celular", value: guest.phone },
        {
          label: "Endereço",
          value: guest.address
            ? `${guest.address}, ${guest.address_number || ""} ${guest.address_complement ? `(${guest.address_complement})` : ""} - ${guest.city}/${guest.state}`
            : null,
        },
        {
          label: "Tipo Sanguíneo",
          value:
            guest.blood_type || guest.blood_rh_factor
              ? `${guest.blood_type || ""} ${guest.blood_rh_factor || ""}`.trim()
              : null,
        },
        {
          label: "Problema Cardíaco",
          value: guest.has_heart_condition ? "Sim" : null,
        },
        { label: "Diabetes", value: guest.has_diabetes ? "Sim" : null },
        {
          label: "Pressão Alta",
          value: guest.has_high_blood_pressure ? "Sim" : null,
        },
        {
          label: "Pressão Baixa",
          value: guest.has_low_blood_pressure ? "Sim" : null,
        },
        { label: "Medicamentos", value: guest.medication_details },
        { label: "Obs. Saúde", value: guest.health_observations },
        {
          label: "Necessidades Especiais",
          value: guest.special_needs_details,
        },
        {
          label: "Contato de Emergência",
          value:
            guest.emergency_contact_name || guest.emergency_contact_phone
              ? `${guest.emergency_contact_name || ""} ${guest.emergency_contact_phone ? `(${guest.emergency_contact_phone})` : ""}`.trim()
              : null,
        },
      ].filter((f) => f.value)

      return fields
        .map(
          (f) =>
            `<div style="font-size: 0.9em; margin-bottom: 2px;"><span style="color: #6b7280; font-weight: 500;">${f.label}:</span> ${f.value}</div>`,
        )
        .join("")
    }

    const leadGuest = saleDetails.guests[0]
    const recipientEmail = leadGuest?.email || user.email
    const recipientName = leadGuest?.name || user.full_name || "Participante"

    const formatCnpj = (cnpj) => {
      if (!cnpj) return ""
      return cnpj.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        "$1.$2.$3/$4-$5",
      )
    }

    const companySection = saleDetails.company_id
      ? `
      <div style="margin-top: 20px; padding: 15px; background-color: #f3f4f6; border-radius: 8px; border: 1px solid #e5e7eb;">
        <h3 style="margin-top: 0; color: #374151; font-size: 1.1em; border-bottom: 1px solid #d1d5db; padding-bottom: 8px; margin-bottom: 10px;">Dados da Empresa</h3>
        <p style="margin: 5px 0;"><strong>CNPJ:</strong> ${formatCnpj(saleDetails.company_cnpj)}</p>
        <p style="margin: 5px 0;"><strong>Razão Social:</strong> ${saleDetails.company_corporate_name}</p>
        ${saleDetails.company_badge ? `<p style="margin: 5px 0;"><strong>Nome da empresa no crachá:</strong> ${saleDetails.company_badge.toUpperCase()}</p>` : ""}
        ${saleDetails.company_email ? `<p style="margin: 5px 0;"><strong>E-mail da empresa:</strong> ${saleDetails.company_email}</p>` : ""}
        ${saleDetails.company_phone ? `<p style="margin: 5px 0;"><strong>Telefone comercial:</strong> ${saleDetails.company_phone}</p>` : ""}
        ${saleDetails.company_responsible_person ? `<p style="margin: 5px 0;"><strong>Pessoa responsável:</strong> ${saleDetails.company_responsible_person}</p>` : ""}
        ${saleDetails.company_zip_code ? `<p style="margin: 5px 0;"><strong>CEP:</strong> ${saleDetails.company_zip_code}</p>` : ""}
        ${saleDetails.company_address ? `<p style="margin: 5px 0;"><strong>Endereço:</strong> ${saleDetails.company_address}</p>` : ""}
        ${saleDetails.company_address_number ? `<p style="margin: 5px 0;"><strong>Número:</strong> ${saleDetails.company_address_number}</p>` : ""}
        ${saleDetails.company_address_complement ? `<p style="margin: 5px 0;"><strong>Complemento:</strong> ${saleDetails.company_address_complement}</p>` : ""}
        ${saleDetails.company_neighborhood ? `<p style="margin: 5px 0;"><strong>Bairro:</strong> ${saleDetails.company_neighborhood}</p>` : ""}
        ${saleDetails.company_activity_sector ? `<p style="margin: 5px 0;"><strong>Ramo de atividade:</strong> ${saleDetails.company_activity_sector}</p>` : ""}
        ${saleDetails.company_country ? `<p style="margin: 5px 0;"><strong>País:</strong> ${saleDetails.company_country}</p>` : ""}
        ${saleDetails.company_state ? `<p style="margin: 5px 0;"><strong>Estado:</strong> ${saleDetails.company_state}</p>` : ""}
        ${saleDetails.company_city ? `<p style="margin: 5px 0;"><strong>Cidade:</strong> ${saleDetails.company_city}</p>` : ""}
      </div>
    `
      : ""

    const installmentsSection = `
      <div style="margin-top: 25px;">
        <h3 style="color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 15px;">Cronograma de Pagamentos</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 0.95em;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="text-align: left; padding: 10px; border: 1px solid #e5e7eb; color: #6b7280;">Parcela</th>
              <th style="text-align: left; padding: 10px; border: 1px solid #e5e7eb; color: #6b7280;">Vencimento</th>
              <th style="text-align: right; padding: 10px; border: 1px solid #e5e7eb; color: #6b7280;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${saleDetails.installments
              .map(
                (inst) => `
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${inst.installment_number} / ${saleDetails.installments_count}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${formatDate(inst.due_date)}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right; font-weight: 500;">${formatCurrency(inst.amount)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `

    const guestCountsString = getGuestCountsString(saleDetails)

    const { originalTotal, economizedAmount, discountLabel } =
      calculateSalePriceBreakdown(saleDetails)

    const priceBreakdownSection = `
      <div style="margin-top: 30px; padding: 20px; background-color: #f8fafc; border-radius: 8px; text-align: right; border: 1px solid #e5e7eb;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.95em; text-align: right; color: #374151;">
          <tr>
            <td style="padding: 4px 0; color: #64748b; text-align: left;">Valor original:</td>
            <td style="padding: 4px 0; font-weight: 500; text-align: right; color: #64748b; ${economizedAmount > 0 ? "text-decoration: line-through;" : ""}">${formatCurrency(originalTotal)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; ${economizedAmount > 0 ? "color: #10b981; font-weight: bold;" : "color: #64748b;"} text-align: left;">${economizedAmount > 0 ? discountLabel : "Desconto"}:</td>
            <td style="padding: 4px 0; ${economizedAmount > 0 ? "color: #10b981; font-weight: bold;" : "color: #64748b;"} text-align: right;">${economizedAmount > 0 ? "-" : ""}${formatCurrency(economizedAmount)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0 0 0; font-size: 0.95em; color: #64748b; border-top: 1px solid #e5e7eb; text-align: left;">Valor com desconto:</td>
            <td style="padding: 8px 0 0 0; font-size: 1.4em; font-weight: bold; color: #2563eb; border-top: 1px solid #e5e7eb; text-align: right;">${formatCurrency(saleDetails.final_amount)}</td>
          </tr>
        </table>
      </div>
    `

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #374151; line-height: 1.5;">
        <div style="line-height: 0;">
          <img src="${webserver.origin}/images/banner-topo.png" alt="17º Simpovidro" width="600" style="width: 600px; max-width: 100%; height: auto; display: block; border-radius: 8px 8px 0 0; border: 1px solid #e5e7eb; border-bottom: none;">
        </div>

        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-bottom: none;">
          <p>Olá, <strong>${recipientName}</strong>!</p>
          <p>Sua inscrição foi finalizada com sucesso. Abaixo você encontra o resumo completo do seu pedido.</p>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #f3f4f6;">
            <h2 style="margin-top: 0; color: #111827; font-size: 1.25em;">Pedido #${saleDetails.sale_number || saleDetails.id.slice(0, 8)}</h2>
            <p style="margin: 5px 0;"><strong>Hotel:</strong> ${saleDetails.hotel_name}</p>
            <p style="margin: 5px 0;"><strong>Quarto:</strong> ${saleDetails.room_name || saleDetails.room_type}</p>
            ${saleDetails.bed_preference ? `<p style="margin: 5px 0;"><strong>Tipo de acomodação:</strong> ${saleDetails.bed_preference}</p>` : ""}
            <p style="margin: 5px 0;"><strong>Quantidade de pessoas:</strong> ${guestCountsString}</p>
            <p style="margin: 5px 0;"><strong>Período:</strong> ${formatDate(saleDetails.check_in_date)} à ${formatDate(saleDetails.check_out_date)}</p>
          </div>

          ${companySection}
          
          <h3 style="color: #374151; margin-top: 25px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Hóspedes Inscritos</h3>
          <div style="margin-bottom: 20px;">
            ${saleDetails.guests
              .map(
                (g, index) => `
              <div style="padding: 12px; border-bottom: 1px solid #f3f4f6;">
                <div style="font-weight: bold; color: #111827;">${index + 1}. ${g.name}</div>
                ${formatGuestDetails(g)}
              </div>
            `,
              )
              .join("")}
          </div>

          ${installmentsSection}
          
          ${priceBreakdownSection}

          <div style="margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px; font-family: sans-serif; font-size: 0.95em;">
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #111827;">Boletos:</p>
            <p style="margin: 0 0 15px 0; color: #4b5563;">Os boletos serão enviados para o e-mail do titular.</p>
            <p style="margin: 0 0 25px 0; color: #4b5563;">Sua inscrição estará efetivada após comprovação da veracidade das informações prestadas e do pagamento de todas as parcelas com vencimento antes do evento.</p>
            <p style="margin: 0; color: #4b5563;">
              Atenciosamente,<br/><br/>
              <strong>Organização 17º Simpovidro</strong>
            </p>
          </div>
        </div>

        <div style="line-height: 0;">
          <img src="${webserver.origin}/images/banner-rodape.png" alt="Patrocinadores e Realização" width="600" style="width: 600px; max-width: 100%; height: auto; display: block; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        </div>
      </div>
    `

    await email.send({
      from: `Simpovidro <simpovidro@abravidro.org.br>`,
      to: recipientEmail,
      bcc: "inscricao@abravidro.org.br, rsilva@abravidro.org.br, scarvalho@abravidro.org.br",
      subject: `17º Simpovidro - dados da inscrição - Nº ${saleDetails.sale_number || saleDetails.id.slice(0, 8)}`,
      html: emailHtml,
      text: `Sua inscrição no Simpovidro 2026 foi confirmada! Hotel: ${saleDetails.hotel_name}. Valor: ${formatCurrency(saleDetails.final_amount)}.`,
    })
  } catch (error) {
    console.error("Falha ao enviar email de confirmação:", error)
  }

  return response.status(201).json({
    saleId: saleId,
    guestIds: guestIds,
  })
}
