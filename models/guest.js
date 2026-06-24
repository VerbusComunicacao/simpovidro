import database from "infra/database.js"
import { ConflictError, ValidationError, NotFoundError } from "infra/errors.js"
import { validateRequiredFields, validateUUID } from "infra/validator.js"
import { cpf } from "cpf-cnpj-validator"
import { parseDate, isLegalAdult } from "../lib/registration-helpers.js"

async function create(guestInputValues, userId, client, isImport = false) {
  applyPlaceholderLogic(guestInputValues)
  if (guestInputValues.birth_date) {
    const parsed = parseDate(guestInputValues.birth_date)
    if (!isNaN(parsed.getTime())) {
      guestInputValues.birth_date = parsed.toISOString().split("T")[0]
    }
  }
  const isAdult = isLegalAdult(guestInputValues.birth_date)

  const requiredFields = [
    "name",
    "badge_name",
    "gender",
    "rg_number",
    "cpf_number",
    "birth_date",
  ]

  if (!isImport) {
    requiredFields.push("phone")
  }

  if (isAdult) {
    requiredFields.push("email")
  }

  validateRequiredFields(guestInputValues, requiredFields)

  await checkUniqueFields(guestInputValues, null, client)

  const resolvedUserId = await resolveUserId(
    guestInputValues.email,
    userId,
    client,
  )

  const newGuest = await runInsertQuery(
    guestInputValues,
    resolvedUserId,
    client,
  )
  return newGuest

  async function runInsertQuery(guestInputValues, userId, client) {
    const {
      name,
      email,
      phone,
      badge_name = null,
      gender,
      rg_number,
      cpf_number,
      passport_number = null,
      medication_details = null,
      blood_type = null,
      blood_rh_factor = null,
      health_observations = null,
      special_needs_details = null,
      has_heart_condition = false,
      has_diabetes = false,
      has_high_blood_pressure = false,
      has_low_blood_pressure = false,
      birth_date,
      nationality = "Brasileira",
      address = null,
      address_number = null,
      address_complement = null,
      neighborhood = null,
      city = null,
      state = null,
      country = "Brasil",
      emergency_contact_name = null,
      emergency_contact_phone = null,
      company_cnpj = null,
      is_pending_info = false,
    } = guestInputValues

    const cleanCompanyCnpj = company_cnpj?.replace(/\D/g, "")

    const db = client || database
    const results = await db.query({
      text: `
        INSERT INTO
          guests (user_id, name, phone, badge_name, gender, rg_number, cpf_number, passport_number, medication_details, blood_type, blood_rh_factor, health_observations, special_needs_details, has_heart_condition, has_diabetes, has_high_blood_pressure, has_low_blood_pressure, birth_date, nationality, address, address_number, address_complement, neighborhood, city, state, country, emergency_contact_name, emergency_contact_phone, email, company_cnpj, is_pending_info)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)
        RETURNING
          *
      `,
      values: [
        userId,
        name,
        phone,
        badge_name?.toUpperCase(),
        gender,
        rg_number,
        cpf_number,
        passport_number,
        medication_details,
        blood_type,
        blood_rh_factor,
        health_observations,
        special_needs_details,
        has_heart_condition,
        has_diabetes,
        has_high_blood_pressure,
        has_low_blood_pressure,
        birth_date,
        nationality,
        address,
        address_number,
        address_complement,
        neighborhood,
        city,
        state,
        country,
        emergency_contact_name,
        emergency_contact_phone,
        email,
        cleanCompanyCnpj,
        is_pending_info,
      ],
    })

    return results.rows[0]
  }
}

async function findOneById(guestId, client) {
  validateUUID(guestId)
  const guestFound = await runSelectQuery(client)
  return guestFound

  async function runSelectQuery(client) {
    const db = client || database
    const results = await db.query({
      text: `
        SELECT
          *
        FROM
          guests
        WHERE
          id = $1
        LIMIT
          1
        ;`,
      values: [guestId],
    })

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O ID do hóspede informado não foi encontrado no sistema.",
        action: "Verifique se o ID está digitado corretamente.",
      })
    }

    return results.rows[0]
  }
}

async function findOneByUserId(userId, client) {
  validateUUID(userId)
  const guestFound = await runSelectQuery(userId, client)
  return guestFound

  async function runSelectQuery(userId, client) {
    const db = client || database
    const results = await db.query({
      text: `
        SELECT
          *
        FROM
          guests
        WHERE
          user_id = $1
        LIMIT
          1
        ;`,
      values: [userId],
    })

    if (results.rowCount === 0) {
      return null
    }

    return results.rows[0]
  }
}

async function upsert(guestData, userId = null, client, isImport = false) {
  applyPlaceholderLogic(guestData)
  if (guestData.birth_date) {
    const parsed = parseDate(guestData.birth_date)
    if (!isNaN(parsed.getTime())) {
      guestData.birth_date = parsed.toISOString().split("T")[0]
    }
  }
  const isAdult = isLegalAdult(guestData.birth_date)

  const requiredFields = [
    "name",
    "gender",
    "rg_number",
    "cpf_number",
    "birth_date",
  ]

  if (!isImport) {
    requiredFields.push("phone")
  }

  if (isAdult) {
    requiredFields.push("email")
  }

  validateRequiredFields(guestData, requiredFields)

  const existingGuest = await findOneByCpfOrRg(
    guestData.cpf_number,
    guestData.rg_number,
    client,
  )

  if (existingGuest) {
    return await update(existingGuest.id, guestData, client)
  }

  return await create(guestData, userId, client, isImport)
}

async function findOneByCpfOrRg(cpf_number, rg_number, client) {
  const db = client || database
  const results = await db.query({
    text: `
      SELECT
        *
      FROM
        guests
      WHERE
        cpf_number = $1 OR rg_number = $2
      LIMIT
        1
      ;`,
    values: [cpf_number, rg_number],
  })

  return results.rows[0] || null
}

function formatPartialCPF(numbers) {
  const clean = numbers.replace(/\D/g, "")
  if (clean.length === 0) return ""
  if (clean.length <= 3) return clean
  if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`
  if (clean.length <= 9)
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`
}

async function findAll({ search = "", page = 1, limit = 10 } = {}) {
  const offset = (page - 1) * limit
  const searchPattern = `%${search}%`
  const formattedSearch = formatPartialCPF(search)
  const formattedSearchPattern = formattedSearch ? `%${formattedSearch}%` : ""

  const results = await database.query({
    text: `
      SELECT
        *,
        count(*) OVER() as full_count
      FROM
        guests
      WHERE
        $1 = '' 
        OR name ILIKE $2 
        OR ($5 != '' AND cpf_number ILIKE $5)
        OR cpf_number ILIKE $2 
        OR email ILIKE $2
      ORDER BY
        created_at DESC
      LIMIT $3 OFFSET $4
    `,
    values: [search, searchPattern, limit, offset, formattedSearchPattern],
  })

  const total =
    results.rows.length > 0 ? parseInt(results.rows[0].full_count, 10) : 0
  const data = results.rows.map((row) => {
    const clonedRow = { ...row }
    delete clonedRow.full_count
    return clonedRow
  })

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}

async function update(guestId, guestInputNewValues, client) {
  if (guestInputNewValues.birth_date) {
    const parsed = parseDate(guestInputNewValues.birth_date)
    if (!isNaN(parsed.getTime())) {
      guestInputNewValues.birth_date = parsed.toISOString().split("T")[0]
    }
  }
  if (guestInputNewValues.cpf_number) {
    const cleanCpf = guestInputNewValues.cpf_number.replace(/\D/g, "")
    if (cleanCpf === "11111111111") {
      applyPlaceholderLogic(guestInputNewValues)
    } else if (guestInputNewValues.is_pending_info === undefined) {
      guestInputNewValues.is_pending_info = false
    }
  }

  if (Object.keys(guestInputNewValues).length === 0) {
    throw new ValidationError({
      message: `Nenhum campo enviado para atualização.`,
      action: "Envie algum campo e tente novamente.",
    })
  }

  const currentGuest = await findOneById(guestId, client)

  const guestWithNewValues = { ...currentGuest, ...guestInputNewValues }

  await checkUniqueFields(guestWithNewValues, guestId, client)

  if (guestInputNewValues.email) {
    guestWithNewValues.user_id = await resolveUserId(
      guestWithNewValues.email,
      guestWithNewValues.user_id,
      client,
    )
  }

  const updatedGuest = await runUpdateQuery(guestWithNewValues, client)
  return updatedGuest

  async function runUpdateQuery(guestWithNewValues, client) {
    const {
      id,
      name,
      email,
      phone,
      badge_name,
      gender,
      rg_number,
      cpf_number,
      passport_number,
      medication_details,
      blood_type,
      blood_rh_factor,
      health_observations,
      special_needs_details,
      has_heart_condition,
      has_diabetes,
      has_high_blood_pressure,
      has_low_blood_pressure,
      birth_date,
      nationality,
      address,
      address_number,
      address_complement,
      neighborhood,
      city,
      state,
      country,
      emergency_contact_name,
      emergency_contact_phone,
      company_cnpj,
      user_id,
      is_pending_info = false,
    } = guestWithNewValues

    const cleanCompanyCnpj = company_cnpj?.replace(/\D/g, "")

    const db = client || database
    const results = await db.query({
      text: `
        UPDATE
          guests
        SET
          name = $2,
          phone = $3,
          badge_name = $4,
          gender = $5,
          rg_number = $6,
          cpf_number = $7,
          passport_number = $8,
          medication_details = $9,
          blood_type = $10,
          blood_rh_factor = $11,
          health_observations = $12,
          special_needs_details = $13,
          has_heart_condition = $14,
          has_diabetes = $15,
          has_high_blood_pressure = $16,
          has_low_blood_pressure = $17,
          birth_date = $18,
          nationality = $19,
          address = $20,
          address_number = $21,
          address_complement = $22,
          neighborhood = $23,
          city = $24,
          state = $25,
          country = $26,
          emergency_contact_name = $27,
          emergency_contact_phone = $28,
          updated_at = timezone('utc', now()),
          email = $29,
          company_cnpj = $30,
          user_id = $31,
          is_pending_info = $32
        WHERE
          id = $1
        RETURNING
          *
      `,
      values: [
        id,
        name,
        phone,
        badge_name?.toUpperCase(),
        gender,
        rg_number,
        cpf_number,
        passport_number,
        medication_details,
        blood_type,
        blood_rh_factor,
        health_observations,
        special_needs_details,
        has_heart_condition,
        has_diabetes,
        has_high_blood_pressure,
        has_low_blood_pressure,
        birth_date,
        nationality,
        address,
        address_number,
        address_complement,
        neighborhood,
        city,
        state,
        country,
        emergency_contact_name,
        emergency_contact_phone,
        email,
        cleanCompanyCnpj,
        user_id,
        is_pending_info,
      ],
    })

    return results.rows[0]
  }
}

async function checkUniqueFields(guestData, currentGuestId = null, client) {
  const { rg_number, cpf_number } = guestData
  const query = {
    text: `
      SELECT rg_number, cpf_number
      FROM guests
      WHERE (rg_number = $1 OR cpf_number = $2)
    `,
    values: [rg_number, cpf_number],
  }

  if (currentGuestId) {
    query.text += ` AND id != $3`
    query.values.push(currentGuestId)
  }

  const db = client || database
  const results = await db.query(query)

  if (results.rowCount > 0) {
    for (const row of results.rows) {
      if (row.rg_number === rg_number) {
        throw new ConflictError({
          message: "Já existe um hóspede cadastrado com este RG.",
          action: "Utilize um RG diferente.",
        })
      }
      if (row.cpf_number === cpf_number) {
        throw new ConflictError({
          message: "Já existe um hóspede cadastrado com este CPF.",
          action: "Utilize um CPF diferente.",
        })
      }
    }
  }
}

async function deleteById(guestId) {
  validateUUID(guestId)

  await database.query({
    text: `
    DELETE FROM guests
    WHERE id = $1
    `,
    values: [guestId],
  })
}

async function resolveUserId(guestEmail, providedUserId, client) {
  if (!guestEmail) return providedUserId
  const db = client || database
  const results = await db.query({
    text: "SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
    values: [guestEmail],
  })
  return results.rows[0]?.id || providedUserId
}

function applyPlaceholderLogic(guestData) {
  const cleanCpf = guestData.cpf_number?.replace(/\D/g, "")
  if (cleanCpf === "11111111111" || guestData.is_pending_info === true) {
    if (cleanCpf === "11111111111") {
      guestData.cpf_number = cpf.generate()
      guestData.rg_number = Math.floor(
        Math.random() * 9000000000 + 1000000000,
      ).toString()
      guestData.name = "A Definir"
      guestData.badge_name = "A DEFINIR"
      guestData.phone = "1111111111"
      guestData.is_pending_info = true
      if (isLegalAdult(guestData.birth_date)) {
        guestData.email = `pendente_${Date.now()}@adefinir.commm`
      }
    } else {
      guestData.name = guestData.name || "A Definir"
      guestData.badge_name = guestData.badge_name || "A DEFINIR"
      guestData.phone = guestData.phone?.replace(/\D/g, "") || "1111111111"
      guestData.is_pending_info = true
      if (isLegalAdult(guestData.birth_date) && !guestData.email) {
        guestData.email = `pendente_${Date.now()}@adefinir.commm`
      }
    }
  }
}

const guest = {
  create,
  update,
  upsert,
  findOneById,
  findOneByUserId,
  findOneByCpfOrRg,
  findAll,
  deleteById,
}

export default guest
