import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import registration from "models/registration.js"
import sale from "models/sale.js"
import { ValidationError, UnauthorizedError } from "infra/errors.js"
import email from "infra/email.js"
import webserver from "infra/webserver.js"
import {
  calculateSalePriceBreakdown,
  getGuestCountsString,
} from "lib/registration-helpers.js"

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
        {
          label: "Obs. Saúde / Alergias / Restrições alimentares",
          value: guest.health_observations,
        },
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
          (f) => `
            <tr>
              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; padding: 4px 0; color: #6b7280; font-weight: 500; width: 180px; vertical-align: top; border: none; background: none;">${f.label}:</td>
              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; padding: 4px 0; color: #374151; vertical-align: top; border: none; background: none;">${f.value}</td>
            </tr>
          `,
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
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; font-family: Arial, Helvetica, sans-serif;">
        <tr><td height="20" style="font-size: 1px; line-height: 1px;">&nbsp;</td></tr>
        <tr>
          <td bgcolor="#f3f4f6" style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; font-family: Arial, Helvetica, sans-serif;">
            <h3 style="font-family: Arial, Helvetica, sans-serif; margin-top: 0; color: #374151; font-size: 1.1em; border-bottom: 1px solid #d1d5db; padding-bottom: 8px; margin-bottom: 10px;">Dados da Empresa</h3>
            <p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>CNPJ:</strong> ${formatCnpj(saleDetails.company_cnpj)}</p>
            <p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>Razão Social:</strong> ${saleDetails.company_corporate_name}</p>
            ${saleDetails.company_badge ? `<p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>Nome da empresa no crachá:</strong> ${saleDetails.company_badge.toUpperCase()}</p>` : ""}
            ${saleDetails.company_email ? `<p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>E-mail da empresa:</strong> ${saleDetails.company_email}</p>` : ""}
            ${saleDetails.company_phone ? `<p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>Telefone comercial:</strong> ${saleDetails.company_phone}</p>` : ""}
            ${saleDetails.company_responsible_person ? `<p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>Pessoa responsável:</strong> ${saleDetails.company_responsible_person}</p>` : ""}
            ${saleDetails.company_zip_code ? `<p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>CEP:</strong> ${saleDetails.company_zip_code}</p>` : ""}
            ${saleDetails.company_address ? `<p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>Endereço:</strong> ${saleDetails.company_address}</p>` : ""}
            ${saleDetails.company_address_number ? `<p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>Número:</strong> ${saleDetails.company_address_number}</p>` : ""}
            ${saleDetails.company_address_complement ? `<p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>Complemento:</strong> ${saleDetails.company_address_complement}</p>` : ""}
            ${saleDetails.company_neighborhood ? `<p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>Bairro:</strong> ${saleDetails.company_neighborhood}</p>` : ""}
            ${saleDetails.company_activity_sector ? `<p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>Ramo de atividade:</strong> ${saleDetails.company_activity_sector}</p>` : ""}
            ${saleDetails.company_country ? `<p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>País:</strong> ${saleDetails.company_country}</p>` : ""}
            ${saleDetails.company_state ? `<p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>Estado:</strong> ${saleDetails.company_state}</p>` : ""}
            ${saleDetails.company_city ? `<p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>Cidade:</strong> ${saleDetails.company_city}</p>` : ""}
          </td>
        </tr>
      </table>
    `
      : ""

    const installmentsSection = `
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; font-family: Arial, Helvetica, sans-serif;">
        <tr><td height="25" style="font-size: 1px; line-height: 1px;">&nbsp;</td></tr>
        <tr>
          <td>
            <h3 style="font-family: Arial, Helvetica, sans-serif; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; margin: 0 0 15px 0;">Cronograma de Pagamentos</h3>
            <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 0.95em; font-family: Arial, Helvetica, sans-serif;">
              <thead>
                <tr>
                  <th bgcolor="#f9fafb" style="font-family: Arial, Helvetica, sans-serif; text-align: left; padding: 10px; border: 1px solid #e5e7eb; color: #6b7280; background-color: #f9fafb;">Parcela</th>
                  <th bgcolor="#f9fafb" style="font-family: Arial, Helvetica, sans-serif; text-align: left; padding: 10px; border: 1px solid #e5e7eb; color: #6b7280; background-color: #f9fafb;">Vencimento</th>
                  <th bgcolor="#f9fafb" style="font-family: Arial, Helvetica, sans-serif; text-align: right; padding: 10px; border: 1px solid #e5e7eb; color: #6b7280; background-color: #f9fafb;">Valor</th>
                </tr>
              </thead>
              <tbody>
                ${saleDetails.installments
                  .map(
                    (inst) => `
                  <tr>
                    <td bgcolor="#ffffff" style="font-family: Arial, Helvetica, sans-serif; padding: 10px; border: 1px solid #e5e7eb; background-color: #ffffff;">${inst.installment_number} / ${saleDetails.installments_count}</td>
                    <td bgcolor="#ffffff" style="font-family: Arial, Helvetica, sans-serif; padding: 10px; border: 1px solid #e5e7eb; background-color: #ffffff;">${formatDate(inst.due_date)}</td>
                    <td bgcolor="#ffffff" style="font-family: Arial, Helvetica, sans-serif; padding: 10px; border: 1px solid #e5e7eb; text-align: right; font-weight: 500; background-color: #ffffff;">${formatCurrency(inst.amount)}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </td>
        </tr>
      </table>
    `

    const guestCountsString = getGuestCountsString(saleDetails)

    const { originalTotal, economizedAmount, discountLabel } =
      calculateSalePriceBreakdown(saleDetails)

    const priceBreakdownSection = `
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; font-family: Arial, Helvetica, sans-serif;">
        <tr><td height="25" style="font-size: 1px; line-height: 1px;">&nbsp;</td></tr>
        <tr>
          <td bgcolor="#f8fafc" style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; font-family: Arial, Helvetica, sans-serif;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.95em; text-align: right; color: #374151; font-family: Arial, Helvetica, sans-serif;">
              <tr>
                <td style="font-family: Arial, Helvetica, sans-serif; padding: 4px 0; color: #64748b; text-align: left; border: none; background: none;">Valor original:</td>
                <td style="font-family: Arial, Helvetica, sans-serif; padding: 4px 0; font-weight: 500; text-align: right; color: #64748b; border: none; background: none; ${economizedAmount > 0 ? "text-decoration: line-through;" : ""}">${formatCurrency(originalTotal)}</td>
              </tr>
              <tr>
                <td style="font-family: Arial, Helvetica, sans-serif; padding: 4px 0; ${economizedAmount > 0 ? "color: #10b981; font-weight: bold;" : "color: #64748b;"} text-align: left; border: none; background: none;">${economizedAmount > 0 ? discountLabel : "Desconto"}:</td>
                <td style="font-family: Arial, Helvetica, sans-serif; padding: 4px 0; ${economizedAmount > 0 ? "color: #10b981; font-weight: bold;" : "color: #64748b;"} text-align: right; border: none; background: none;">${economizedAmount > 0 ? "-" : ""}${formatCurrency(economizedAmount)}</td>
              </tr>
              <tr>
                <td style="font-family: Arial, Helvetica, sans-serif; padding: 8px 0 0 0; font-size: 0.95em; color: #64748b; border-top: 1px solid #e5e7eb; text-align: left; background: none;">Valor com desconto:</td>
                <td style="font-family: Arial, Helvetica, sans-serif; padding: 8px 0 0 0; font-size: 1.4em; font-weight: bold; color: #2563eb; border-top: 1px solid #e5e7eb; text-align: right; background: none;">${formatCurrency(saleDetails.final_amount)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `

    const emailHtml = `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <!--[if gte mso 9]>
        <xml>
          <o:OfficeDocumentSettings>
            <o:AllowPNG/>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
        <![endif]-->
        <title>Confirmação de Inscrição</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f3f4f6" style="background-color: #f3f4f6; width: 100%; margin: 0; padding: 20px 0;">
          <tr>
            <td align="center" valign="top">
              <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="width: 600px; max-width: 100%; font-family: Arial, Helvetica, sans-serif; color: #374151; line-height: 1.5; border-collapse: collapse; margin: 0 auto; border: 1px solid #e5e7eb; background-color: #ffffff;" bgcolor="#ffffff">
                <!-- Header Image -->
                <tr>
                  <td style="padding: 0; line-height: 0; font-family: Arial, Helvetica, sans-serif;">
                    <img src="${webserver.origin}/images/banner-topo.png" alt="17º Simpovidro" width="600" style="width: 600px; max-width: 100%; height: auto; display: block; border-radius: 8px 8px 0 0;">
                  </td>
                </tr>

                <!-- Body Content -->
                <tr>
                  <td bgcolor="#ffffff" style="padding: 20px; background-color: #ffffff; text-align: left; font-family: Arial, Helvetica, sans-serif;">
                    <p style="font-family: Arial, Helvetica, sans-serif; margin: 0 0 15px 0;">Olá, <strong>${recipientName}</strong>!</p>
                    <p style="font-family: Arial, Helvetica, sans-serif; margin: 0 0 15px 0;">Sua inscrição foi finalizada com sucesso. Abaixo você encontra o resumo completo do seu pedido.</p>
                    
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; border-collapse: collapse; font-family: Arial, Helvetica, sans-serif;">
                      <tr>
                        <td bgcolor="#f9fafb" style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #f3f4f6; font-family: Arial, Helvetica, sans-serif;">
                          <h2 style="font-family: Arial, Helvetica, sans-serif; margin-top: 0; color: #111827; font-size: 1.25em; margin-bottom: 12px;">Pedido #${saleDetails.sale_number || saleDetails.id.slice(0, 8)}</h2>
                          <p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>Hotel:</strong> ${saleDetails.hotel_name}</p>
                          <p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>Quarto:</strong> ${saleDetails.room_name || saleDetails.room_type}</p>
                          ${saleDetails.bed_preference ? `<p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>Tipo de acomodação:</strong> ${saleDetails.bed_preference}</p>` : ""}
                          <p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>Quantidade de pessoas:</strong> ${guestCountsString}</p>
                          <p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>Período:</strong> ${formatDate(saleDetails.check_in_date)} à ${formatDate(saleDetails.check_out_date)}</p>
                        </td>
                      </tr>
                    </table>

                    ${companySection}
                    
                    <h3 style="font-family: Arial, Helvetica, sans-serif; color: #374151; margin-top: 25px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 15px;">Hóspedes Inscritos</h3>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px; border-collapse: collapse; font-family: Arial, Helvetica, sans-serif;">
                      ${saleDetails.guests
                        .map(
                          (g, index) => `
                        <tr>
                          <td bgcolor="#ffffff" style="padding: 12px; border-bottom: 1px solid #e5e7eb; vertical-align: top; font-family: Arial, Helvetica, sans-serif; background-color: #ffffff;">
                            <div style="font-family: Arial, Helvetica, sans-serif; font-weight: bold; color: #111827; margin-bottom: 6px; font-size: 14px;">${index + 1}. ${g.name}</div>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; font-family: Arial, Helvetica, sans-serif; background-color: #ffffff;">
                              ${formatGuestDetails(g)}
                            </table>
                          </td>
                        </tr>
                      `,
                        )
                        .join("")}
                    </table>

                    ${
                      saleDetails.hotel_checkout_question &&
                      saleDetails.checkout_question_response
                        ? `
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; border-collapse: collapse; font-family: Arial, Helvetica, sans-serif;">
                      <tr>
                        <td bgcolor="#eff6ff" style="background-color: #eff6ff; padding: 15px 20px; border: 1px solid #bfdbfe; border-radius: 8px; font-family: Arial, Helvetica, sans-serif; font-size: 13.5px;">
                          <p style="font-family: Arial, Helvetica, sans-serif; margin: 0 0 6px 0; color: #1e3a8a; font-weight: bold; font-size: 14px;">${saleDetails.hotel_checkout_question}</p>
                          <p style="font-family: Arial, Helvetica, sans-serif; margin: 0; color: #1d4ed8; font-style: italic; font-weight: 500; font-size: 14px;">Resposta: ${saleDetails.checkout_question_response}</p>
                        </td>
                      </tr>
                    </table>
                    `
                        : ""
                    }

                    ${installmentsSection}
                    
                    ${priceBreakdownSection}

                    <div style="margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px; font-family: Arial, Helvetica, sans-serif; font-size: 0.95em;">
                      <p style="font-family: Arial, Helvetica, sans-serif; margin: 0 0 8px 0; font-weight: bold; color: #111827;">Boletos:</p>
                      <p style="font-family: Arial, Helvetica, sans-serif; margin: 0 0 15px 0; color: #4b5563;">Os boletos serão enviados para o e-mail do titular.</p>
                      <p style="font-family: Arial, Helvetica, sans-serif; margin: 0 0 25px 0; color: #4b5563;">Sua inscrição estará efetivada após comprovação da veracidade das informações prestadas e do pagamento de todas as parcelas com vencimento antes do evento.</p>
                      <p style="font-family: Arial, Helvetica, sans-serif; margin: 0; color: #4b5563;">
                        Atenciosamente,<br/><br/>
                        <strong>Organização 17º Simpovidro</strong>
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Spacer between body and footer -->
                <tr>
                  <td bgcolor="#ffffff" height="25" style="font-size: 1px; line-height: 1px; background-color: #ffffff; font-family: Arial, Helvetica, sans-serif;">&nbsp;</td>
                </tr>

                <!-- Footer Image -->
                <tr>
                  <td style="padding: 0; line-height: 0; font-family: Arial, Helvetica, sans-serif;">
                    <img src="${webserver.origin}/images/banner-rodape2.png" alt="Patrocinadores e Realização" width="600" style="width: 600px; max-width: 100%; height: auto; display: block; border-radius: 0 0 8px 8px;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
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
