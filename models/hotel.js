import database from "infra/database.js"
import { ConflictError, ValidationError, NotFoundError } from "infra/errors.js"
import {
  validateRequiredFields as validateRequired,
  validateUUID,
} from "infra/validator.js"

async function create(hotelInputValues, userId) {
  validateRequired(hotelInputValues, ["name", "city", "country"])
  await verifyIHotelAlreadyExists(hotelInputValues.name, userId)

  const newHotel = await runInsertQuery(hotelInputValues, userId)
  return newHotel

  async function runInsertQuery(hotelInputValues, userId) {
    const {
      name,
      email = null,
      phone = null,
      address = null,
      city,
      state = null,
      country = null,
    } = hotelInputValues

    const results = await database.query({
      text: `
        INSERT INTO
          hotels (user_id, name, email, phone, address, city, state, country, active)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING
          *
      `,
      values: [userId, name, email, phone, address, city, state, country, false],
    })

    return results.rows[0]
  }
}

async function findOneById(hotelId) {
  validateUUID(hotelId)
  const hotelFound = await runSelectQuery(hotelId)
  return hotelFound

  async function runSelectQuery(hotelId) {
    const results = await database.query({
      text: `
        SELECT 
          * 
        FROM 
          hotels
        WHERE 
          id = $1
        LIMIT
          1
        ;`,
      values: [hotelId],
    })

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O ID do hotel informado não foi encontrado no sistema.",
        action: "Verifique se o ID está digitado corretamente.",
      })
    }

    return results.rows[0]
  }
}

async function findOneByIdAndUserId(hotelId, userId) {
  validateUUID(hotelId)

  const results = await database.query({
    text: `
      SELECT 
        * 
      FROM 
        hotels
      WHERE 
        id = $1 AND user_id = $2
      LIMIT
        1
      ;`,
    values: [hotelId, userId],
  })

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "O ID do hotel informado não foi encontrado no sistema.",
      action: "Verifique se o ID está digitado corretamente.",
    })
  }

  return results.rows[0]
}

async function update(hotelId, hotelInputNewValues, userId) {
  if (Object.keys(hotelInputNewValues).length === 0) {
    throw new ValidationError({
      message: `Nenhum campo enviado para atualização.`,
      action: "Envie algum campo e tente novamente.",
    })
  }

  const currentHotel = await findOneById(hotelId)

  // Validar campos apenas se fornecidos
  const fieldsToValidate = ["name", "city", "country"].filter(
    (field) => field in hotelInputNewValues,
  )
  if (fieldsToValidate.length > 0) {
    validateRequired(hotelInputNewValues, fieldsToValidate)
  }

  // Verificar se o nome já existe (apenas se o nome estiver sendo alterado)
  if (
    "name" in hotelInputNewValues &&
    hotelInputNewValues.name !== currentHotel.name
  ) {
    await verifyIHotelAlreadyExists(hotelInputNewValues.name, userId)
  }

  const hotelWithNewValues = { ...currentHotel, ...hotelInputNewValues }

  const updatedHotel = await runUpdateQuery(hotelWithNewValues)
  return updatedHotel

  async function runUpdateQuery(hotelWithNewValues) {
    const { id, name, email, phone, address, city, state, country, active } =
      hotelWithNewValues

    const client = await database.getNewClient()
    try {
      await client.query("BEGIN")

      if (active === true) {
        // Desativa todos os outros hotéis
        await client.query("UPDATE hotels SET active = false")
      }

      const results = await client.query({
        text: `
          UPDATE
            hotels
          SET 
            name = $2,
            email = $3,
            phone = $4,
            address = $5,
            city = $6,
            state = $7,
            country = $8,
            active = $9,
            updated_at = timezone('utc', now())
          WHERE
            id = $1
          RETURNING
            *
        `,
        values: [id, name, email, phone, address, city, state, country, active],
      })

      await client.query("COMMIT")
      return results.rows[0]
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      await client.end()
    }
  }
}

async function deleteById(hotelId, userId) {
  validateUUID(hotelId)
  validateUUID(userId)

  await database.query({
    text: `
    DELETE FROM hotels
    WHERE user_id = $1 and id = $2
    `,
    values: [userId, hotelId],
  })
}

async function findAllByUserId(userId) {
  const results = await database.query({
    text: `
      SELECT 
        id,
        name,
        email,
        phone,
        address,
        city,
        state,
        country,
        active,
        created_at,
        updated_at
      FROM 
        hotels
      WHERE 
        user_id = $1
      ORDER BY 
        created_at DESC
    `,
    values: [userId],
  })

  return results.rows
}

async function verifyIHotelAlreadyExists(name, userId) {
  const results = await database.query({
    text: `
      SELECT *
      FROM hotels
      WHERE user_id = $1
        AND name = $2
      LIMIT 1
    `,
    values: [userId, name],
  })

  if (results.rowCount > 0) {
    throw new ConflictError({
      message: "Já existe um hotel cadastrado com esse nome para este usuário.",
      action: "Escolha outro nome ou edite o hotel existente.",
    })
  }
}

async function activate(hotelId) {
  validateUUID(hotelId)

  const client = await database.getNewClient()
  try {
    await client.query("BEGIN")

    // 1. Desativa todos os hotéis
    await client.query("UPDATE hotels SET active = false")

    // 2. Ativa o hotel alvo
    const results = await client.query({
      text: "UPDATE hotels SET active = true, updated_at = timezone('utc', now()) WHERE id = $1 RETURNING *",
      values: [hotelId],
    })

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O ID do hotel informado não foi encontrado no sistema.",
        action: "Verifique se o ID está digitado corretamente.",
      })
    }

    await client.query("COMMIT")
    return results.rows[0]
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    await client.end()
  }
}

const hotel = {
  create,
  findOneById,
  findOneByIdAndUserId,
  findAllByUserId,
  update,
  deleteById,
  activate,
}
export default hotel
