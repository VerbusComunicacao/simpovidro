import database from "infra/database.js"
import { ConflictError, ValidationError, NotFoundError } from "infra/errors.js"
import { validateRequiredFields, validateUUID } from "infra/validator.js"

async function create(guestInputValues, userId) {
  validateRequiredFields(guestInputValues, [
    "name",
    "phone",
    "gender",
    "rg_number",
    "cpf_number",
    "birth_date",
  ])
  await checkUniqueFields(guestInputValues)

  const resolvedUserId = await resolveUserId(guestInputValues.email, userId)

  const newGuest = await runInsertQuery(guestInputValues, resolvedUserId)
  return newGuest

  async function runInsertQuery(guestInputValues, userId) {
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
    } = guestInputValues

    const cleanCompanyCnpj = company_cnpj?.replace(/\D/g, "")

    const results = await database.query({
      text: `
        INSERT INTO
          guests (user_id, name, phone, badge_name, gender, rg_number, cpf_number, passport_number, medication_details, blood_type, blood_rh_factor, health_observations, special_needs_details, has_heart_condition, has_diabetes, has_high_blood_pressure, has_low_blood_pressure, birth_date, nationality, address, address_number, address_complement, neighborhood, city, state, country, emergency_contact_name, emergency_contact_phone, email, company_cnpj)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)
        RETURNING
          *
      `,
      values: [
        userId,
        name,
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
        email,
        cleanCompanyCnpj,
      ],
    })

    return results.rows[0]
  }
}

async function findOneById(guestId) {
  validateUUID(guestId)
  const guestFound = await runSelectQuery()
  return guestFound

  async function runSelectQuery() {
    const results = await database.query({
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

async function findOneByUserId(userId) {
  validateUUID(userId)
  const guestFound = await runSelectQuery(userId)
  return guestFound

  async function runSelectQuery(userId) {
    const results = await database.query({
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

async function upsert(guestData, userId = null) {
  validateRequiredFields(guestData, [
    "name",
    "phone",
    "gender",
    "rg_number",
    "cpf_number",
    "birth_date",
  ])

  const existingGuest = await findOneByCpfOrRg(
    guestData.cpf_number,
    guestData.rg_number,
  )

  if (existingGuest) {
    return await update(existingGuest.id, guestData)
  }

  return await create(guestData, userId)
}

async function findOneByCpfOrRg(cpf_number, rg_number) {
  const results = await database.query({
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

async function findAll() {
  const results = await database.query({
    text: `
      SELECT
        *
      FROM
        guests
      ORDER BY
        created_at DESC
    `,
  })

  return results.rows
}

async function update(guestId, guestInputNewValues) {
  if (Object.keys(guestInputNewValues).length === 0) {
    throw new ValidationError({
      message: `Nenhum campo enviado para atualização.`,
      action: "Envie algum campo e tente novamente.",
    })
  }

  const currentGuest = await findOneById(guestId)

  const guestWithNewValues = { ...currentGuest, ...guestInputNewValues }

  await checkUniqueFields(guestWithNewValues, guestId)

  if (guestInputNewValues.email) {
    guestWithNewValues.user_id = await resolveUserId(
      guestWithNewValues.email,
      guestWithNewValues.user_id,
    )
  }

  const updatedGuest = await runUpdateQuery(guestWithNewValues)
  return updatedGuest

  async function runUpdateQuery(guestWithNewValues) {
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
    } = guestWithNewValues

    const cleanCompanyCnpj = company_cnpj?.replace(/\D/g, "")

    const results = await database.query({
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
          user_id = $31
        WHERE
          id = $1
        RETURNING
          *
      `,
      values: [
        id,
        name,
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
        email,
        cleanCompanyCnpj,
        user_id,
      ],
    })

    return results.rows[0]
  }
}

async function checkUniqueFields(guestData, currentGuestId = null) {
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

  const results = await database.query(query)

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

async function resolveUserId(guestEmail, providedUserId) {
  if (!guestEmail) return providedUserId
  const results = await database.query({
    text: "SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
    values: [guestEmail],
  })
  return results.rows[0]?.id || providedUserId
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
