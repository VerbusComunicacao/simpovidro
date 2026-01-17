import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import guest from "models/guest.js"
import sale from "models/sale.js"
import company from "models/company.js"
import { ValidationError, UnauthorizedError } from "infra/errors.js"
import email from "infra/email.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.post(postHandler)

export default router.handler(controller.errorHandlers)

async function postHandler(request, response) {
  const user = request.context.user
  const {
    room_id,
    guests_data,
    company_cnpj,
    payment_method,
    installments_count,
  } = request.body

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
    if (
      currentGuestData.cpf_number &&
      usedCPFs.has(currentGuestData.cpf_number)
    ) {
      throw new ValidationError({
        message: "Os hóspedes informados não podem ser iguais (CPF duplicado).",
        action: "Verifique os dados dos hóspedes e tente novamente.",
      })
    }
    if (currentGuestData.rg_number && usedRGs.has(currentGuestData.rg_number)) {
      throw new ValidationError({
        message: "Os hóspedes informados não podem ser iguais (RG duplicado).",
        action: "Verifique os dados dos hóspedes e tente novamente.",
      })
    }
    if (currentGuestData.cpf_number) usedCPFs.add(currentGuestData.cpf_number)
    if (currentGuestData.rg_number) usedRGs.add(currentGuestData.rg_number)
  }

  let companyId = null
  if (company_cnpj) {
    const cleanCnpj = company_cnpj.replace(/\D/g, "")
    try {
      const foundCompany = await company.findOneByCnpj(cleanCnpj)
      companyId = foundCompany.id
    } catch (error) {
      if (error.name !== "NotFoundError") throw error
      // Se não encontrar a empresa e o CNPJ foi passado, pode ser que
      // a empresa tenha acabado de ser criada ou ainda não existe.
      // No fluxo ideal, a empresa já foi criada ou encontrada no step anterior.
    }
  }

  // 1. Process all guests
  const savedGuestIds = []

  for (let i = 0; i < guests_data.length; i++) {
    const currentGuestData = guests_data[i]

    // First guest is associated with the logged-in user if it's a new record
    const guestUserId = i === 0 ? user.id : null

    // Add company_cnpj to each guest data so it's saved in the profile
    const guestDataWithCnpj = {
      ...currentGuestData,
      company_cnpj: company_cnpj,
    }

    const savedGuest = await guest.upsert(guestDataWithCnpj, guestUserId)
    savedGuestIds.push(savedGuest.id)
  }

  // 2. Create Sale (Transactions handling: Validate room, Check availability, Create Sale, Update Room Availability)
  const newSale = await sale.create({
    guest_ids: savedGuestIds,
    room_id: room_id,
    company_id: companyId,
    payment_method: payment_method,
    installments_count: installments_count,
  })

  // 3. Send Confirmation Email
  try {
    const saleDetails = await sale.findOneByIdWithDetails(newSale.id)

    const formatDate = (date) => new Date(date).toLocaleDateString("pt-BR")
    const formatCurrency = (val) =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(val)

    // Helper to format key-value pairs cleanly
    const formatGuestDetails = (guest) => {
      const fields = [
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
        { label: "Medicamentos", value: guest.medication_details },
        { label: "Obs. Saúde", value: guest.health_observations },
      ].filter((f) => f.value)

      return fields
        .map(
          (f) =>
            `<div style="font-size: 0.9em; margin-bottom: 2px;"><span style="color: #6b7280; font-weight: 500;">${f.label}:</span> ${f.value}</div>`,
        )
        .join("")
    }

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Confirmação de Inscrição - Simpovidro 2026</h1>
        <p>Olá, <strong>${user.full_name || "Participante"}</strong>!</p>
        <p>Sua inscrição foi confirmada com sucesso! Abaixo estão os detalhes do seu pedido:</p>
        
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px;">
          <h2 style="margin-top: 0; color: #111827;">Pedido #${saleDetails.sale_number || saleDetails.id.slice(0, 8)}</h2>
          <p><strong>Hotel:</strong> ${saleDetails.hotel_name}</p>
          <p><strong>Endereço:</strong> ${saleDetails.hotel_address || ""}, ${saleDetails.hotel_city || ""} - ${saleDetails.hotel_state || ""}</p>
          <p><strong>Quarto:</strong> ${saleDetails.room_name || saleDetails.room_type} (${saleDetails.room_category})</p>
          <p><strong>Período:</strong> ${formatDate(saleDetails.check_in_date)} à ${formatDate(saleDetails.check_out_date)}</p>
          
          <h3 style="color: #374151; margin-top: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Hóspedes</h3>
          <div style="display: grid; gap: 15px;">
            ${saleDetails.guests
              .map(
                (g, index) => `
              <div style="background-color: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
                <div style="font-weight: bold; color: #111827; margin-bottom: 5px;">${index + 1}. ${g.name}</div>
                ${formatGuestDetails(g)}
              </div>
            `,
              )
              .join("")}
          </div>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: right;">
            <p style="margin: 0; font-size: 0.9em; color: #6b7280;">Valor Total</p>
            <p style="margin: 0; font-size: 1.5em; font-weight: bold; color: #111827;">${formatCurrency(saleDetails.final_amount)}</p>
          </div>
        </div>
        
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
        
        <p style="color: #6b7280; font-size: 0.9em;">Se tiver dúvidas, entre em contato conosco.</p>
        <p style="color: #6b7280; font-size: 0.9em;">Atenciosamente,<br/>Equipe Simpovidro</p>
      </div>
    `

    await email.send({
      from: "Abravidro <contato@resend.dev>",
      to: user.email,
      subject: `Confirmação de Inscrição - Pedido #${saleDetails.sale_number || saleDetails.id.slice(0, 8)}`,
      html: emailHtml,
      text: `Sua inscrição no Simpovidro 2026 foi confirmada! Hotel: ${saleDetails.hotel_name}. Valor: ${formatCurrency(saleDetails.final_amount)}.`,
    })
  } catch (error) {
    console.error("Falha ao enviar email de confirmação:", error)
  }

  return response.status(201).json({
    saleId: newSale.id,
    guestIds: savedGuestIds,
  })
}
