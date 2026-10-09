import email from "infra/email.js"
import webserver from "infra/webserver.js"
import sale from "models/sale.js"
import {
  calculateSalePriceBreakdown,
  getGuestCountsString,
  ACTIVITY_SECTORS_EN,
  translateText,
} from "lib/registration-helpers.js"

export async function sendRegistrationEmail(
  saleId,
  { isAlteration = false, user = null } = {},
) {
  try {
    const saleDetails = await sale.findOneByIdWithDetails(saleId)
    if (!saleDetails) return

    const isInternational = saleDetails.guests?.some(
      (g) => g.passport_number && g.passport_number.trim() !== "",
    )

    const translatedActivitySector = isInternational
      ? ACTIVITY_SECTORS_EN[saleDetails.company_activity_sector] ||
        (saleDetails.company_activity_sector === "OUTRO"
          ? "OTHER"
          : saleDetails.company_activity_sector)
      : saleDetails.company_activity_sector

    const formatDate = (date) => {
      if (!date) return ""
      const dateStr =
        date instanceof Date ? date.toISOString().split("T")[0] : String(date)
      const [year, month, day] = dateStr.split("T")[0].split("-")
      return isInternational
        ? `${month}/${day}/${year}`
        : `${day}/${month}/${year}`
    }
    const formatCurrency = (val) =>
      new Intl.NumberFormat(isInternational ? "en-US" : "pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(val)

    // Helper to format key-value pairs cleanly
    const formatGuestDetails = (guest) => {
      const fields = [
        {
          label: isInternational ? "Badge Name" : "Crachá",
          value: guest.badge_name?.toUpperCase(),
        },
        { label: "CPF", value: guest.cpf_number },
        { label: "RG", value: guest.rg_number },
        {
          label: isInternational ? "Passport" : "Passaporte",
          value: guest.passport_number,
        },
        {
          label: isInternational ? "Birth Date" : "Nascimento",
          value: guest.birth_date ? formatDate(guest.birth_date) : null,
        },
        { label: "Email", value: guest.email },
        {
          label: isInternational ? "Mobile Phone" : "Celular",
          value: guest.phone,
        },
        {
          label: isInternational ? "Address" : "Endereço",
          value: guest.address
            ? `${guest.address}, ${guest.address_number || ""} ${guest.address_complement ? `(${guest.address_complement})` : ""} - ${guest.city}/${guest.state}`
            : null,
        },
        {
          label: isInternational ? "Blood Type" : "Tipo Sanguíneo",
          value:
            guest.blood_type || guest.blood_rh_factor
              ? `${guest.blood_type || ""} ${guest.blood_rh_factor || ""}`.trim()
              : null,
        },
        {
          label: isInternational ? "Heart Condition" : "Problema Cardíaco",
          value: guest.has_heart_condition
            ? isInternational
              ? "Yes"
              : "Sim"
            : null,
        },
        {
          label: "Diabetes",
          value: guest.has_diabetes ? (isInternational ? "Yes" : "Sim") : null,
        },
        {
          label: isInternational ? "High Blood Pressure" : "Pressão Alta",
          value: guest.has_high_blood_pressure
            ? isInternational
              ? "Yes"
              : "Sim"
            : null,
        },
        {
          label: isInternational ? "Low Blood Pressure" : "Pressão Baixa",
          value: guest.has_low_blood_pressure
            ? isInternational
              ? "Yes"
              : "Sim"
            : null,
        },
        {
          label: isInternational ? "Medications" : "Medicamentos",
          value: guest.medication_details,
        },
        {
          label: isInternational
            ? "Health Notes / Allergies / Dietary Restrictions"
            : "Obs. Saúde / Alergias / Restrições alimentares",
          value: guest.health_observations,
        },
        {
          label: isInternational ? "Special Needs" : "Necessidades Especiais",
          value: guest.special_needs_details,
        },
        {
          label: isInternational
            ? "Emergency Contact"
            : "Contato de Emergência",
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

    const leadGuest = saleDetails.guests && saleDetails.guests[0]
    const recipientEmail = leadGuest?.email || user?.email
    const recipientName =
      leadGuest?.name ||
      user?.full_name ||
      (isInternational ? "Participant" : "Participante")

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
            <h3 style="font-family: Arial, Helvetica, sans-serif; margin-top: 0; color: #374151; font-size: 1.1em; border-bottom: 1px solid #d1d5db; padding-bottom: 8px; margin-bottom: 10px;">${isInternational ? "Company Details" : "Dados da Empresa"}</h3>
            ${saleDetails.company_cnpj ? `<p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>CNPJ:</strong> ${formatCnpj(saleDetails.company_cnpj)}</p>` : ""}
            <p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>${isInternational ? "Corporate Name" : "Razão Social"}:</strong> ${saleDetails.company_corporate_name}</p>
            ${saleDetails.company_badge ? `<p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>${isInternational ? "Company badge name" : "Nome da empresa no crachá"}:</strong> ${saleDetails.company_badge.toUpperCase()}</p>` : ""}
            ${saleDetails.company_email ? `<p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>${isInternational ? "Company email" : "E-mail da empresa"}:</strong> ${saleDetails.company_email}</p>` : ""}
            ${saleDetails.company_phone ? `<p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>${isInternational ? "Business phone" : "Telefone comercial"}:</strong> ${saleDetails.company_phone}</p>` : ""}
            ${saleDetails.company_responsible_person ? `<p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>${isInternational ? "Responsible person" : "Pessoa responsável"}:</strong> ${saleDetails.company_responsible_person}</p>` : ""}
            ${saleDetails.company_zip_code ? `<p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>${isInternational ? "Zip Code" : "CEP"}:</strong> ${saleDetails.company_zip_code}</p>` : ""}
            ${saleDetails.company_address ? `<p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>${isInternational ? "Address" : "Endereço"}:</strong> ${saleDetails.company_address}</p>` : ""}
            ${saleDetails.company_address_number ? `<p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>${isInternational ? "Number" : "Número"}:</strong> ${saleDetails.company_address_number}</p>` : ""}
            ${saleDetails.company_address_complement ? `<p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>${isInternational ? "Complement" : "Complemento"}:</strong> ${saleDetails.company_address_complement}</p>` : ""}
            ${saleDetails.company_neighborhood ? `<p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>${isInternational ? "Neighborhood" : "Bairro"}:</strong> ${saleDetails.company_neighborhood}</p>` : ""}
            ${translatedActivitySector ? `<p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>${isInternational ? "Activity sector" : "Ramo de atividade"}:</strong> ${translatedActivitySector}</p>` : ""}
            ${saleDetails.company_country ? `<p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>${isInternational ? "Country" : "País"}:</strong> ${saleDetails.company_country}</p>` : ""}
            ${saleDetails.company_state ? `<p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>${isInternational ? "State" : "Estado"}:</strong> ${saleDetails.company_state}</p>` : ""}
            ${saleDetails.company_city ? `<p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>${isInternational ? "City" : "Cidade"}:</strong> ${saleDetails.company_city}</p>` : ""}
          </td>
        </tr>
      </table>
    `
      : ""

    const isFree = Number(saleDetails.final_amount) === 0

    const isCreditCard =
      saleDetails.payment_method === "credit_card" ||
      saleDetails.payment_method?.startsWith("credit")

    const cardBrandLabel =
      saleDetails.payment_method === "credit-card_amex"
        ? "AMEX"
        : "Mastercard / Visa"

    const cardInstallmentsCount = saleDetails.installments_count || 1
    const cardInstallmentAmount =
      saleDetails.final_amount / cardInstallmentsCount

    const installmentsSection = isFree
      ? `
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; font-family: Arial, Helvetica, sans-serif;">
        <tr><td height="25" style="font-size: 1px; line-height: 1px;">&nbsp;</td></tr>
        <tr>
          <td>
            <h3 style="font-family: Arial, Helvetica, sans-serif; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; margin: 0 0 15px 0;">${isInternational ? "Payment: Free Registration" : "Pagamento: Isenção (100% de Desconto)"}</h3>
            <div style="background-color: #f0fdf4; padding: 15px 20px; border: 1px solid #bbf7d0; border-radius: 8px; font-family: Arial, Helvetica, sans-serif; font-size: 13.5px;">
              <p style="margin: 0; color: #166534; font-weight: bold;">${isInternational ? "No payment required. Registration confirmed." : "Inscrição com 100% de desconto confirmada sem custos adicionais."}</p>
            </div>
          </td>
        </tr>
      </table>
      `
      : isCreditCard
        ? `
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; font-family: Arial, Helvetica, sans-serif;">
        <tr><td height="25" style="font-size: 1px; line-height: 1px;">&nbsp;</td></tr>
        <tr>
          <td>
            <h3 style="font-family: Arial, Helvetica, sans-serif; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; margin: 0 0 15px 0;">${isInternational ? "Payment Method: Credit Card" : "Forma de Pagamento: Cartão de Crédito"}</h3>
            <div style="background-color: #eff6ff; padding: 15px 20px; border: 1px solid #bfdbfe; border-radius: 8px; font-family: Arial, Helvetica, sans-serif; font-size: 13.5px;">
              <p style="margin: 0 0 6px 0; color: #1e3a8a;"><strong>${isInternational ? "Card Brand:" : "Bandeira:"}</strong> ${cardBrandLabel}</p>
              <p style="margin: 0 0 8px 0; color: #1e3a8a;"><strong>${isInternational ? "Installments Plan:" : "Parcelas:"}</strong> ${cardInstallmentsCount}x ${isInternational ? "of" : "de"} ${formatCurrency(cardInstallmentAmount)} ${isInternational ? "interest-free" : "sem juros"}</p>
              <p style="margin: 0; color: #1d4ed8; font-style: italic;">${isInternational ? "The organization will contact you to send the credit card payment link." : "A organização entrará em contato para o envio do link de pagamento do cartão."}</p>
            </div>
          </td>
        </tr>
      </table>
      `
        : `
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; font-family: Arial, Helvetica, sans-serif;">
        <tr><td height="25" style="font-size: 1px; line-height: 1px;">&nbsp;</td></tr>
        <tr>
          <td>
            <h3 style="font-family: Arial, Helvetica, sans-serif; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; margin: 0 0 15px 0;">${isInternational ? "Payment Schedule" : "Cronograma de Pagamentos"}</h3>
            <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 0.95em; font-family: Arial, Helvetica, sans-serif;">
              <thead>
                <tr>
                  <th bgcolor="#f9fafb" style="font-family: Arial, Helvetica, sans-serif; text-align: left; padding: 10px; border: 1px solid #e5e7eb; color: #6b7280; background-color: #f9fafb;">${isInternational ? "Installment" : "Parcela"}</th>
                  <th bgcolor="#f9fafb" style="font-family: Arial, Helvetica, sans-serif; text-align: left; padding: 10px; border: 1px solid #e5e7eb; color: #6b7280; background-color: #f9fafb;">${isInternational ? "Due Date" : "Vencimento"}</th>
                  <th bgcolor="#f9fafb" style="font-family: Arial, Helvetica, sans-serif; text-align: right; padding: 10px; border: 1px solid #e5e7eb; color: #6b7280; background-color: #f9fafb;">${isInternational ? "Amount" : "Valor"}</th>
                </tr>
              </thead>
              <tbody>
                ${(saleDetails.installments || [])
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

    let guestCountsString = getGuestCountsString(saleDetails, isInternational)
    if (isInternational) {
      guestCountsString = guestCountsString
        .replace(/adulto\(s\)/gi, "adult(s)")
        .replace(/Criança\(s\)/gi, "Child(ren)")
        .replace(/criança\(s\)/gi, "child(ren)")
        .replace(/\bde\b/gi, "from")
        .replace(/\ba\b/gi, "to")
        .replace(/\banos\b/gi, "years")
    }

    const { originalTotal, economizedAmount, discountLabel } =
      calculateSalePriceBreakdown(saleDetails)

    let discountLabelEn = discountLabel
    if (isInternational) {
      if (discountLabel === "Desconto associado Abravidro") {
        discountLabelEn = "Abravidro member discount"
      } else if (discountLabel === "Desconto associado de entidade regional") {
        discountLabelEn = "Regional association member discount"
      } else if (discountLabel === "Desconto") {
        discountLabelEn = "Discount"
      }
    }

    const priceBreakdownSection = `
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; font-family: Arial, Helvetica, sans-serif;">
        <tr><td height="25" style="font-size: 1px; line-height: 1px;">&nbsp;</td></tr>
        <tr>
          <td bgcolor="#f8fafc" style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; font-family: Arial, Helvetica, sans-serif;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.95em; text-align: right; color: #374151; font-family: Arial, Helvetica, sans-serif;">
              <tr>
                <td style="font-family: Arial, Helvetica, sans-serif; padding: 4px 0; color: #64748b; text-align: left; border: none; background: none;">${isInternational ? "Original price:" : "Valor original:"}</td>
                <td style="font-family: Arial, Helvetica, sans-serif; padding: 4px 0; font-weight: 500; text-align: right; color: #64748b; border: none; background: none; ${economizedAmount > 0 ? "text-decoration: line-through;" : ""}">${formatCurrency(originalTotal)}</td>
              </tr>
              <tr>
                <td style="font-family: Arial, Helvetica, sans-serif; padding: 4px 0; ${economizedAmount > 0 ? "color: #10b981; font-weight: bold;" : "color: #64748b;"} text-align: left; border: none; background: none;">${economizedAmount > 0 ? (isInternational ? discountLabelEn : discountLabel) : isInternational ? "Discount" : "Desconto"}:</td>
                <td style="font-family: Arial, Helvetica, sans-serif; padding: 4px 0; ${economizedAmount > 0 ? "color: #10b981; font-weight: bold;" : "color: #64748b;"} text-align: right; border: none; background: none;">${economizedAmount > 0 ? "-" : ""}${formatCurrency(economizedAmount)}</td>
              </tr>
              <tr>
                <td style="font-family: Arial, Helvetica, sans-serif; padding: 8px 0 0 0; font-size: 0.95em; color: #64748b; border-top: 1px solid #e5e7eb; text-align: left; background: none;">${isInternational ? "Amount with discount:" : "Valor com desconto:"}</td>
                <td style="font-family: Arial, Helvetica, sans-serif; padding: 8px 0 0 0; font-size: 1.4em; font-weight: bold; color: #2563eb; border-top: 1px solid #e5e7eb; text-align: right; background: none;">${formatCurrency(saleDetails.final_amount)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `

    const bankRemittanceNote = isInternational
      ? `
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; font-family: Arial, Helvetica, sans-serif;">
        <tr><td height="10" style="font-size: 1px; line-height: 1px;">&nbsp;</td></tr>
        <tr>
          <td style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #4b5563; padding: 10px 0; font-style: italic;">
            * For payments by bank remittance, 2 charges will be added: 0,38% I.O.F (Brazilian tax) + USD180,00 (Bank tax)
          </td>
        </tr>
      </table>
      `
      : ""

    // Determine subject, title and intro based on status
    const isCancelled = saleDetails.status === "cancelled"

    const subject = isInternational
      ? isCancelled
        ? `17th Simpovidro - Cancelled registration - No. ${saleDetails.sale_number || saleDetails.id.slice(0, 8)}`
        : isAlteration
          ? `17th Simpovidro - Registration alteration - No. ${saleDetails.sale_number || saleDetails.id.slice(0, 8)}`
          : `17th Simpovidro - Registration details - No. ${saleDetails.sale_number || saleDetails.id.slice(0, 8)}`
      : isCancelled
        ? `17º Simpovidro - Inscrição cancelada - Nº ${saleDetails.sale_number || saleDetails.id.slice(0, 8)}`
        : isAlteration
          ? `17º Simpovidro - Alteração da inscrição - Nº ${saleDetails.sale_number || saleDetails.id.slice(0, 8)}`
          : `17º Simpovidro - dados da inscrição - Nº ${saleDetails.sale_number || saleDetails.id.slice(0, 8)}`

    const title = isInternational
      ? isCancelled
        ? `Registration Cancelled`
        : isAlteration
          ? `Registration Alteration`
          : `Registration Confirmation`
      : isCancelled
        ? `Inscrição Cancelada`
        : isAlteration
          ? `Alteração de Inscrição`
          : `Confirmação de Inscrição`

    const intro = isInternational
      ? isCancelled
        ? `Your registration has been cancelled. Below is the summary of the cancelled order.`
        : isAlteration
          ? `Your registration has been altered. Below is the updated summary of your order.`
          : `Thank you for registering on 17th Simpovidro.<br/>Kindly check following detailed resume of your information.`
      : isCancelled
        ? `Sua inscrição foi cancelada. Abaixo você encontra o resumo do pedido cancelado.`
        : isAlteration
          ? `Sua inscrição foi alterada. Abaixo você encontra o resumo atualizado do seu pedido.`
          : `Sua inscrição foi finalizada com sucesso. Abaixo você encontra o resumo completo do seu pedido.`

    const text = isInternational
      ? isCancelled
        ? `Your registration for Simpovidro 2026 has been cancelled! Hotel: ${saleDetails.hotel_name}. Amount: ${formatCurrency(saleDetails.final_amount)}.`
        : isAlteration
          ? `Your registration for Simpovidro 2026 has been altered! Hotel: ${saleDetails.hotel_name}. Amount: ${formatCurrency(saleDetails.final_amount)}.`
          : `Your registration for Simpovidro 2026 has been confirmed! Hotel: ${saleDetails.hotel_name}. Amount: ${formatCurrency(saleDetails.final_amount)}.`
      : isCancelled
        ? `Sua inscrição no Simpovidro 2026 foi cancelada! Hotel: ${saleDetails.hotel_name}. Valor: ${formatCurrency(saleDetails.final_amount)}.`
        : isAlteration
          ? `Sua inscrição no Simpovidro 2026 foi alterada! Hotel: ${saleDetails.hotel_name}. Valor: ${formatCurrency(saleDetails.final_amount)}.`
          : `Sua inscrição no Simpovidro 2026 foi confirmada! Hotel: ${saleDetails.hotel_name}. Valor: ${formatCurrency(saleDetails.final_amount)}.`

    const helloLabel = isInternational ? "Hello" : "Olá"
    const translatedBedPreference = isInternational
      ? saleDetails.bed_preference === "Duplo Casal"
        ? "Double Couple"
        : saleDetails.bed_preference === "Duplo Solteiro"
          ? "Double Single"
          : saleDetails.bed_preference
      : saleDetails.bed_preference

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
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f3f4f6" style="background-color: #f3f4f6; width: 100%; margin: 0; padding: 20px 0;">
          <tr>
            <td align="center" valign="top">
              <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="width: 600px; max-width: 100%; font-family: Arial, Helvetica, sans-serif; color: #374151; line-height: 1.5; border-collapse: collapse; margin: 0 auto; border: 1px solid #e5e7eb; background-color: #ffffff;" bgcolor="#ffffff">
                <!-- Header Image -->
                <tr>
                  <td style="padding: 0; line-height: 0; font-family: Arial, Helvetica, sans-serif;">
                    <img src="${webserver.origin}/images/banner-topo2.png" alt="17º Simpovidro" width="600" style="width: 600px; max-width: 100%; height: auto; display: block; border-radius: 8px 8px 0 0;">
                  </td>
                </tr>

                <!-- Body Content -->
                <tr>
                  <td bgcolor="#ffffff" style="padding: 20px; background-color: #ffffff; text-align: left; font-family: Arial, Helvetica, sans-serif;">
                    <p style="font-family: Arial, Helvetica, sans-serif; margin: 0 0 15px 0;">${helloLabel}, <strong>${recipientName}</strong>!</p>
                    <p style="font-family: Arial, Helvetica, sans-serif; margin: 0 0 15px 0;">${intro}</p>
                    
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; border-collapse: collapse; font-family: Arial, Helvetica, sans-serif;">
                      <tr>
                        <td bgcolor="#f9fafb" style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #f3f4f6; font-family: Arial, Helvetica, sans-serif;">
                          <h2 style="font-family: Arial, Helvetica, sans-serif; margin-top: 0; color: #111827; font-size: 1.25em; margin-bottom: 12px;">${isInternational ? "Order #" : "Pedido #"}${saleDetails.sale_number || saleDetails.id.slice(0, 8)}</h2>
                          <p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>Hotel:</strong> ${saleDetails.hotel_name}</p>
                          <p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>${isInternational ? "Room" : "Quarto"}:</strong> ${translateText(saleDetails.room_name || saleDetails.room_type, isInternational)}</p>
                          ${saleDetails.bed_preference ? `<p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>${isInternational ? "Accommodation type" : "Tipo de acomodação"}:</strong> ${translatedBedPreference}</p>` : ""}
                          <p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>${isInternational ? "Number of guests" : "Quantidade de pessoas"}:</strong> ${guestCountsString}</p>
                          <p style="font-family: Arial, Helvetica, sans-serif; margin: 5px 0; font-size: 14px;"><strong>${isInternational ? "Period" : "Período"}:</strong> ${formatDate(saleDetails.check_in_date)} ${isInternational ? "to" : "à"} ${formatDate(saleDetails.check_out_date)}</p>
                        </td>
                      </tr>
                    </table>

                    ${companySection}
                    
                    <h3 style="font-family: Arial, Helvetica, sans-serif; color: #374151; margin-top: 25px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 15px;">${isInternational ? "Registered Guests" : "Hóspedes Inscritos"}</h3>
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
                      (isInternational
                        ? saleDetails.hotel_checkout_question_en ||
                          saleDetails.hotel_checkout_question
                        : saleDetails.hotel_checkout_question) &&
                      saleDetails.checkout_question_response
                        ? `
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; border-collapse: collapse; font-family: Arial, Helvetica, sans-serif;">
                      <tr>
                        <td bgcolor="#eff6ff" style="background-color: #eff6ff; padding: 15px 20px; border: 1px solid #bfdbfe; border-radius: 8px; font-family: Arial, Helvetica, sans-serif; font-size: 13.5px;">
                          <p style="font-family: Arial, Helvetica, sans-serif; margin: 0 0 6px 0; color: #1e3a8a; font-weight: bold; font-size: 14px;">${isInternational ? saleDetails.hotel_checkout_question_en || saleDetails.hotel_checkout_question : saleDetails.hotel_checkout_question}</p>
                          <p style="font-family: Arial, Helvetica, sans-serif; margin: 0; color: #1d4ed8; font-style: italic; font-weight: 500; font-size: 14px;">${isInternational ? "Response:" : "Resposta:"} ${saleDetails.checkout_question_response}</p>
                        </td>
                      </tr>
                    </table>
                    `
                        : ""
                    }

                    ${installmentsSection}
                    
                    ${priceBreakdownSection}
                    ${bankRemittanceNote}

                    <div style="margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px; font-family: Arial, Helvetica, sans-serif; font-size: 0.95em;">
                      ${
                        isFree
                          ? isInternational
                            ? `
                        <p style="font-family: Arial, Helvetica, sans-serif; margin: 0 0 8px 0; font-weight: bold; color: #111827;">Registration Confirmed:</p>
                        <p style="font-family: Arial, Helvetica, sans-serif; margin: 0 0 15px 0; color: #4b5563;">Your registration has a 100% discount and is fully confirmed.</p>
                        <p style="font-family: Arial, Helvetica, sans-serif; margin: 0 0 25px 0; color: #4b5563;">All participants have to inform their flights to organization until October, 16th 2026, to fit all transfers.<br/>
                        Phone: (+55.11) 3873-9908.<br/>
                        E-mail: logistica@abravidro.org.br</p>
                        <p style="font-family: Arial, Helvetica, sans-serif; margin: 0; color: #4b5563;">
                          Best regards,<br/><br/>
                          <strong>17th Simpovidro organization</strong>
                        </p>
                      `
                            : `
                        <p style="font-family: Arial, Helvetica, sans-serif; margin: 0 0 8px 0; font-weight: bold; color: #111827;">Inscrição Confirmada:</p>
                        <p style="font-family: Arial, Helvetica, sans-serif; margin: 0 0 15px 0; color: #4b5563;">Sua inscrição possui 100% de desconto e está confirmada.</p>
                        <p style="font-family: Arial, Helvetica, sans-serif; margin: 0 0 25px 0; color: #4b5563;">Todos os participantes devem informar seus voos à organização até 16 de outubro de 2026 para organização dos transfers.<br/>Telefone: (11) 3873-9908.<br/>E-mail: logistica@abravidro.org.br</p>
                        <p style="font-family: Arial, Helvetica, sans-serif; margin: 0; color: #4b5563;">
                          Atenciosamente,<br/><br/>
                          <strong>Organização 17º Simpovidro</strong>
                        </p>
                      `
                          : isInternational
                            ? `
                        <p style="font-family: Arial, Helvetica, sans-serif; margin: 0 0 8px 0; font-weight: bold; color: #111827;">${isCreditCard ? "Credit Card Payment:" : `Payment - Due date: ${saleDetails.installments?.[0]?.due_date ? formatDate(saleDetails.installments[0].due_date) : ""}`}</p>
                        <p style="font-family: Arial, Helvetica, sans-serif; margin: 0 0 15px 0; color: #4b5563;">${isCreditCard ? "The organization will contact you to send the credit card payment link." : "After confirming the veracity of the information provided, the organization will contact you to arrange payment details."}</p>
                        <p style="font-family: Arial, Helvetica, sans-serif; margin: 0 0 25px 0; color: #4b5563;">All participants have to inform their flights to organization until October, 16th 2026, to fit all transfers.<br/>
                        Phone: (+55.11) 3873-9908.<br/>
                        E-mail: logistica@abravidro.org.br</p>
                        <p style="font-family: Arial, Helvetica, sans-serif; margin: 0; color: #4b5563;">
                          Best regards,<br/><br/>
                          <strong>17th Simpovidro organization</strong>
                        </p>
                      `
                            : `
                        <p style="font-family: Arial, Helvetica, sans-serif; margin: 0 0 8px 0; font-weight: bold; color: #111827;">${isCreditCard ? "Cartão de Crédito:" : "Boletos:"}</p>
                        <p style="font-family: Arial, Helvetica, sans-serif; margin: 0 0 15px 0; color: #4b5563;">${isCreditCard ? "A organização entrará em contato para o envio do link de pagamento do cartão de crédito." : "Os boletos serão enviados para o e-mail do titular."}</p>
                        <p style="font-family: Arial, Helvetica, sans-serif; margin: 0 0 25px 0; color: #4b5563;">Sua inscrição estará efetivada após comprovação da veracidade das informações prestadas e do pagamento ${isCreditCard ? "do valor total da inscrição." : "de todas as parcelas com vencimento antes do evento."}</p>
                        <p style="font-family: Arial, Helvetica, sans-serif; margin: 0; color: #4b5563;">
                          Atenciosamente,<br/><br/>
                          <strong>Organização 17º Simpovidro</strong>
                        </p>
                      `
                      }
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

    const toEmail =
      isAlteration || isCancelled
        ? "inscricao@abravidro.org.br"
        : recipientEmail

    const bccEmails =
      isAlteration || isCancelled
        ? undefined
        : "inscricao@abravidro.org.br, rsilva@abravidro.org.br, scarvalho@abravidro.org.br"

    await email.send({
      from: `Simpovidro <simpovidro@abravidro.org.br>`,
      to: toEmail,
      bcc: bccEmails,
      subject: subject,
      html: emailHtml,
      text: text,
    })
  } catch (error) {
    console.error(
      "Falha ao enviar email de alteração/confirmação/cancelamento:",
      error,
    )
  }
}

export async function sendFlightTransferEmail(flightData) {
  try {
    const toEmail = "logistica@abravidro.org.br"
    const bccList = [
      "inscricao@abravidro.org.br",
      "rsilva@abravidro.org.br",
      "scarvalho@abravidro.org.br",
      flightData.participant_email,
    ]
      .filter(Boolean)
      .join(", ")

    const subject = `[17º Simpovidro] Informações de Voo e Transfer - ${flightData.participant_name || "Participante"}`

    const hasInFlight =
      flightData.in_date ||
      flightData.in_flight_number ||
      flightData.in_airline ||
      flightData.in_locator
    const hasOutFlight =
      flightData.out_date ||
      flightData.out_flight_number ||
      flightData.out_airline ||
      flightData.out_locator

    const emailHtml = `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; -webkit-text-size-adjust: 100%;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f3f4f6" style="background-color: #f3f4f6; width: 100%; margin: 0; padding: 20px 0;">
          <tr>
            <td align="center" valign="top">
              <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="width: 600px; max-width: 100%; font-family: Arial, Helvetica, sans-serif; color: #374151; line-height: 1.5; border-collapse: collapse; margin: 0 auto; border: 1px solid #e5e7eb; background-color: #ffffff;" bgcolor="#ffffff">
                <!-- Header Image -->
                <tr>
                  <td style="padding: 0; line-height: 0;">
                    <img src="${webserver.origin}/images/banner-topo2.png" alt="17º Simpovidro" width="600" style="width: 600px; max-width: 100%; height: auto; display: block; border-radius: 8px 8px 0 0;">
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td bgcolor="#ffffff" style="padding: 24px; text-align: left;">
                    <h2 style="color: #111827; font-size: 1.3em; margin: 0 0 12px 0; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">
                      ✈️ Informações de Voo e Transfer Cadastradas
                    </h2>
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #4b5563;">
                      Novos dados de voo/transfer foram informados para a logística do 17º Simpovidro.
                    </p>

                    <!-- Participante Info -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px;">
                      <tr>
                        <td>
                          <h3 style="margin: 0 0 10px 0; font-size: 15px; color: #1e293b;">👤 Dados do Participante</h3>
                          <table border="0" cellpadding="3" cellspacing="0" width="100%" style="font-size: 13.5px;">
                            <tr>
                              <td width="150" style="font-weight: bold; color: #64748b;">Nome:</td>
                              <td style="color: #0f172a; font-weight: 600;">${flightData.participant_name || "-"}</td>
                            </tr>
                            ${flightData.company_name ? `<tr><td style="font-weight: bold; color: #64748b;">Empresa:</td><td>${flightData.company_name}</td></tr>` : ""}
                            ${flightData.participant_cpf ? `<tr><td style="font-weight: bold; color: #64748b;">CPF/Doc:</td><td>${flightData.participant_cpf}</td></tr>` : ""}
                            ${flightData.participant_phone ? `<tr><td style="font-weight: bold; color: #64748b;">Celular:</td><td>${flightData.participant_phone}</td></tr>` : ""}
                            ${flightData.participant_email ? `<tr><td style="font-weight: bold; color: #64748b;">E-mail:</td><td>${flightData.participant_email}</td></tr>` : ""}
                            ${flightData.hotel_name ? `<tr><td style="font-weight: bold; color: #64748b;">Hotel:</td><td>${flightData.hotel_name}</td></tr>` : ""}
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Voo Ida (IN) -->
                    ${
                      hasInFlight
                        ? `
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 15px;">
                      <tr>
                        <td>
                          <h3 style="margin: 0 0 10px 0; font-size: 15px; color: #1e40af;">🛫 Voo de Ida (Transfer IN / Chegada)</h3>
                          <table border="0" cellpadding="3" cellspacing="0" width="100%" style="font-size: 13.5px;">
                            <tr>
                              <td width="150" style="font-weight: bold; color: #3b82f6;">Data in Chegada:</td>
                              <td style="color: #1e3a8a; font-weight: 600;">${flightData.in_date || "-"}</td>
                            </tr>
                            <tr>
                              <td style="font-weight: bold; color: #3b82f6;">Companhia Aérea:</td>
                              <td>${flightData.in_airline || "-"}</td>
                            </tr>
                            <tr>
                              <td style="font-weight: bold; color: #3b82f6;">LOCALIZADOR:</td>
                              <td style="font-family: monospace; font-weight: bold;">${flightData.in_locator || "-"}</td>
                            </tr>
                            <tr>
                              <td style="font-weight: bold; color: #3b82f6;">Voo ida (Nº):</td>
                              <td>${flightData.in_flight_number || "-"}</td>
                            </tr>
                            <tr>
                              <td style="font-weight: bold; color: #3b82f6;">Aeroporto Origem:</td>
                              <td>${flightData.in_origin_airport || "-"}</td>
                            </tr>
                            <tr>
                              <td style="font-weight: bold; color: #3b82f6;">Horário chegada:</td>
                              <td style="font-weight: 600;">${flightData.in_arrival_time || "-"}</td>
                            </tr>
                            <tr>
                              <td style="font-weight: bold; color: #3b82f6;">Aeroporto Destino:</td>
                              <td>${flightData.in_destination_airport || "-"}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    `
                        : ""
                    }

                    <!-- Voo Volta (OUT) -->
                    ${
                      hasOutFlight
                        ? `
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px; background-color: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 15px;">
                      <tr>
                        <td>
                          <h3 style="margin: 0 0 10px 0; font-size: 15px; color: #854d0e;">🛬 Voo de Retorno (Transfer OUT / Saída)</h3>
                          <table border="0" cellpadding="3" cellspacing="0" width="100%" style="font-size: 13.5px;">
                            <tr>
                              <td width="150" style="font-weight: bold; color: #ca8a04;">Data OUT Saída:</td>
                              <td style="color: #713f12; font-weight: 600;">${flightData.out_date || "-"}</td>
                            </tr>
                            <tr>
                              <td style="font-weight: bold; color: #ca8a04;">Companhia Aérea:</td>
                              <td>${flightData.out_airline || "-"}</td>
                            </tr>
                            <tr>
                              <td style="font-weight: bold; color: #ca8a04;">LOCALIZADOR:</td>
                              <td style="font-family: monospace; font-weight: bold;">${flightData.out_locator || "-"}</td>
                            </tr>
                            <tr>
                              <td style="font-weight: bold; color: #ca8a04;">Voo Retorno (Nº):</td>
                              <td>${flightData.out_flight_number || "-"}</td>
                            </tr>
                            <tr>
                              <td style="font-weight: bold; color: #ca8a04;">Aeroporto Saída:</td>
                              <td>${flightData.out_departure_airport || "-"}</td>
                            </tr>
                            <tr>
                              <td style="font-weight: bold; color: #ca8a04;">Horário/Saída:</td>
                              <td style="font-weight: 600;">${flightData.out_departure_time || "-"}</td>
                            </tr>
                            ${flightData.out_destination_airport ? `<tr><td style="font-weight: bold; color: #ca8a04;">Aeroporto Destino:</td><td>${flightData.out_destination_airport}</td></tr>` : ""}
                          </table>
                        </td>
                      </tr>
                    </table>
                    `
                        : ""
                    }

                    ${
                      flightData.notes
                        ? `
                    <div style="background-color: #f1f5f9; padding: 12px 15px; border-radius: 8px; margin-bottom: 20px; font-size: 13.5px;">
                      <strong>Observações:</strong> ${flightData.notes}
                    </div>
                    `
                        : ""
                    }

                    <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
                      Equipe de Logística 17º Simpovidro<br/>
                      Telefone: (+55.11) 3873-9908<br/>
                      E-mail: logistica@abravidro.org.br
                    </p>
                  </td>
                </tr>

                <!-- Footer Image -->
                <tr>
                  <td style="padding: 0; line-height: 0;">
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

    const plainText = `
Informações de Voo e Transfer - 17º Simpovidro
Participante: ${flightData.participant_name}
Empresa: ${flightData.company_name || "-"}
Telefone: ${flightData.participant_phone || "-"}
E-mail: ${flightData.participant_email || "-"}

VOO IDA (IN):
Data: ${flightData.in_date || "-"}
Companhia: ${flightData.in_airline || "-"}
Localizador: ${flightData.in_locator || "-"}
Nº Voo: ${flightData.in_flight_number || "-"}
Origem: ${flightData.in_origin_airport || "-"}
Horário Chegada: ${flightData.in_arrival_time || "-"}
Destino: ${flightData.in_destination_airport || "-"}

VOO VOLTA (OUT):
Data: ${flightData.out_date || "-"}
Companhia: ${flightData.out_airline || "-"}
Localizador: ${flightData.out_locator || "-"}
Nº Voo: ${flightData.out_flight_number || "-"}
Aeroporto Saída: ${flightData.out_departure_airport || "-"}
Horário Saída: ${flightData.out_departure_time || "-"}
Destino: ${flightData.out_destination_airport || "-"}

Obs: ${flightData.notes || "-"}
    `.trim()

    await email.send({
      from: `Simpovidro Logística <simpovidro@abravidro.org.br>`,
      to: toEmail,
      bcc: bccList,
      subject: subject,
      html: emailHtml,
      text: plainText,
    })
  } catch (err) {
    console.error("Falha ao enviar email de voo e transfer:", err)
  }
}
