import guest from "models/guest.js"
import userModel from "models/user.js"
import sale from "models/sale.js"
import company from "models/company.js"
import { ValidationError } from "infra/errors.js"
import database from "infra/database.js"

async function create(userOrId, registrationData) {
  const userId = typeof userOrId === "string" ? userOrId : userOrId.id
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

    // 1. Resolve Company if CNPJ or Data provided
    let companyId = null
    const companyToProcess =
      registrationData.company_data ||
      (registrationData.company_cnpj
        ? { cnpj: registrationData.company_cnpj }
        : null)

    if (companyToProcess) {
      const upsertedCompany = await company.upsert(companyToProcess, client)
      companyId = upsertedCompany?.id || null
    }

    // 2. Process all guests
    const savedGuestIds = []

    // Fetch trusted identity (Guest Profile OR Account Data)
    const userAccount = await userModel.findOneById(userId, client)
    const registrantProfile = await guest.findOneByUserId(userId, client)

    const trustedEmail = registrantProfile?.email || userAccount.email

    for (let i = 0; i < guests_data.length; i++) {
      const currentGuestData = { ...guests_data[i] }

      const inputEmail = (currentGuestData.email || "").trim().toLowerCase()
      const dbEmail = (trustedEmail || "").trim().toLowerCase()

      // First guest associated with logged-in user only if email matches
      const guestUserId = i === 0 && inputEmail === dbEmail ? userId : null

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
        bed_preference: registrationData.bed_preference,
        user_id: userId,
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
