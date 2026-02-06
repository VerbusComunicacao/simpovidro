import guest from "models/guest.js"
import sale from "models/sale.js"
import company from "models/company.js"
import { ValidationError } from "infra/errors.js"
import database from "infra/database.js"

async function create(userId, registrationData) {
  const {
    room_id,
    guests_data,
    company_cnpj,
    payment_method,
    installments_count,
  } = registrationData

  if (!Array.isArray(guests_data) || guests_data.length === 0) {
    throw new ValidationError({
      message: "É necessário informar pelo menos um hóspede.",
      action: "Adicione os dados do hóspede e tente novamente.",
    })
  }

  const client = await database.getNewClient()

  try {
    await client.query("BEGIN")

    // 1. Resolve Company if CNPJ provided
    let companyId = null
    if (company_cnpj) {
      const cleanCnpj = company_cnpj.replace(/\D/g, "")
      try {
        const foundCompany = await company.findOneByCnpj(cleanCnpj, client)
        companyId = foundCompany.id
      } catch (error) {
        if (error.name !== "NotFoundError") throw error
        // If not found, companyId remains null
      }
    }

    // 2. Process all guests
    const savedGuestIds = []
    for (let i = 0; i < guests_data.length; i++) {
      const currentGuestData = guests_data[i]

      // First guest associated with logged-in user if it's new
      const guestUserId = i === 0 ? userId : null

      const guestDataWithCnpj = {
        ...currentGuestData,
        company_cnpj: company_cnpj,
      }

      const savedGuest = await guest.upsert(
        guestDataWithCnpj,
        guestUserId,
        client,
      )
      savedGuestIds.push(savedGuest.id)
    }

    // 3. Create Sale
    const newSale = await sale.create(
      {
        guest_ids: savedGuestIds,
        room_id: room_id,
        company_id: companyId,
        payment_method: payment_method,
        installments_count: installments_count,
      },
      client,
    )

    await client.query("COMMIT")

    return {
      saleId: newSale.id,
      guestIds: savedGuestIds,
    }
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    await client.end()
  }
}

const registration = {
  create,
}

export default registration
