import database from "infra/database.js"
import { ConflictError, ValidationError, NotFoundError } from "infra/errors.js"
import { validateRequiredFields, validateUUID } from "infra/validator.js"

async function create(guestInputValues, userId) {
  validateRequiredFields(guestInputValues, [
    "name",
    "email",
    "phone",
    "gender",
    "rg_number",
    "cpf_number",
    "birth_date",
  ])
  await checkUniqueFields(guestInputValues)

  const newGuest = await runInsertQuery(guestInputValues, userId)
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
    } = guestInputValues

    const results = await database.query({
      text: `
        INSERT INTO
          guests (user_id, name, email, phone, badge_name, gender, rg_number, cpf_number, passport_number, medication_details, blood_type, blood_rh_factor, health_observations, special_needs_details, has_heart_condition, has_diabetes, has_high_blood_pressure, has_low_blood_pressure, birth_date, nationality, address, address_number, address_complement, neighborhood, city, state, country, emergency_contact_name, emergency_contact_phone)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
        RETURNING
          *
      `,
      values: [
        userId,
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
      ],
    })

    return results.rows[0]
  }
}

async function findOneById(guestId) {
  validateUUID(guestId)
  const guestFound = await runSelectQuery(guestId)
  return guestFound

  async function runSelectQuery(guestId) {
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
    } = guestWithNewValues

    const results = await database.query({
      text: `
        UPDATE
          guests
        SET
          name = $2,
          email = $3,
          phone = $4,
          badge_name = $5,
          gender = $6,
          rg_number = $7,
          cpf_number = $8,
          passport_number = $9,
          medication_details = $10,
          blood_type = $11,
          blood_rh_factor = $12,
          health_observations = $13,
          special_needs_details = $14,
          has_heart_condition = $15,
          has_diabetes = $16,
          has_high_blood_pressure = $17,
          has_low_blood_pressure = $18,
          birth_date = $19,
          nationality = $20,
          address = $21,
          address_number = $22,
          address_complement = $23,
          neighborhood = $24,
          city = $25,
          state = $26,
          country = $27,
          emergency_contact_name = $28,
          emergency_contact_phone = $29,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
      `,
      values: [
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
      ],
    })

    return results.rows[0]
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

async function checkUniqueFields(guestData, currentGuestId = null) {
  const { email, rg_number, cpf_number } = guestData
  const query = {
    text: `
      SELECT email, rg_number, cpf_number
      FROM guests
      WHERE (email = $1 OR rg_number = $2 OR cpf_number = $3)
    `,
    values: [email, rg_number, cpf_number],
  }

  if (currentGuestId) {
    query.text += ` AND id != $4`
    query.values.push(currentGuestId)
  }

  const results = await database.query(query)

  if (results.rowCount > 0) {
    for (const row of results.rows) {
      if (row.email === email) {
        throw new ConflictError({
          message: "Já existe um hóspede cadastrado com este e-mail.",
          action: "Utilize um e-mail diferente.",
        })
      }
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

const guest = {
  create,
  findOneById,
  findAll,
  update,
  deleteById,
}

export default guest
