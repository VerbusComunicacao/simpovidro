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
          hotels (user_id, name, email, phone, address, city, state, country)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING
          *
      `,
      values: [userId, name, email, phone, address, city, state, country],
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

  // Validar campos obrigatórios se fornecidos
  if (Object.keys(hotelInputNewValues).length > 0) {
    validateRequired(hotelInputNewValues, ["name", "city", "country"])
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
    const { id, name, email, phone, address, city, state, country } =
      hotelWithNewValues

    const results = await database.query({
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
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
      `,
      values: [id, name, email, phone, address, city, state, country],
    })

    return results.rows[0]
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

const hotel = {
  create,
  findOneById,
  findOneByIdAndUserId,
  findAllByUserId,
  update,
  deleteById,
}
export default hotel
