import database from "infra/database.js"
import { ValidationError, NotFoundError } from "infra/errors.js"
import { validateRequiredFields, validateUUID } from "infra/validator.js"

async function create(saleInputValues, hotelId) {
  validateRequiredFields(saleInputValues, [
    "guest_id",
    "room_id",
    "check_in_date",
    "check_out_date",
    "total_price",
  ])

  const newSale = await runInsertQuery(saleInputValues, hotelId)
  return newSale

  async function runInsertQuery(saleInputValues, hotelId) {
    const {
      guest_id,
      room_id,
      check_in_date,
      check_out_date,
      total_price,
      company_id = null,
    } = saleInputValues

    const results = await database.query({
      text: `
        INSERT INTO
          sales (hotel_id, guest_id, room_id, check_in_date, check_out_date, total_price, company_id)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
          *
      `,
      values: [
        hotelId,
        guest_id,
        room_id,
        check_in_date,
        check_out_date,
        total_price,
        company_id,
      ],
    })

    return results.rows[0]
  }
}

async function findOneById(saleId) {
  validateUUID(saleId)
  const saleFound = await runSelectQuery(saleId)
  return saleFound

  async function runSelectQuery(saleId) {
    const results = await database.query({
      text: `
        SELECT 
          * 
        FROM 
          sales
        WHERE 
          id = $1
        LIMIT
          1
        ;`,
      values: [saleId],
    })

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O ID da venda informado não foi encontrado no sistema.",
        action: "Verifique se o ID está digitado corretamente.",
      })
    }

    return results.rows[0]
  }
}

async function findAllByHotelId(hotelId) {
  const results = await database.query({
    text: `
      SELECT 
        *
      FROM 
        sales
      WHERE 
        hotel_id = $1
      ORDER BY 
        created_at DESC
    `,
    values: [hotelId],
  })

  return results.rows
}

async function update(saleId, saleInputNewValues) {
  if (Object.keys(saleInputNewValues).length === 0) {
    throw new ValidationError({
      message: `Nenhum campo enviado para atualização.`,
      action: "Envie algum campo e tente novamente.",
    })
  }

  const currentSale = await findOneById(saleId)

  if (Object.keys(saleInputNewValues).length > 0) {
    validateRequiredFields(saleInputNewValues, [
      "guest_id",
      "room_id",
      "check_in_date",
      "check_out_date",
      "total_price",
    ])
  }

  const saleWithNewValues = { ...currentSale, ...saleInputNewValues }

  const updatedSale = await runUpdateQuery(saleWithNewValues)
  return updatedSale

  async function runUpdateQuery(saleWithNewValues) {
    const {
      id,
      guest_id,
      room_id,
      check_in_date,
      check_out_date,
      total_price,
      company_id,
    } = saleWithNewValues

    const results = await database.query({
      text: `
        UPDATE
          sales
        SET 
          guest_id = $2,
          room_id = $3,
          check_in_date = $4,
          check_out_date = $5,
          total_price = $6,
          company_id = $7,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
      `,
      values: [
        id,
        guest_id,
        room_id,
        check_in_date,
        check_out_date,
        total_price,
        company_id,
      ],
    })

    return results.rows[0]
  }
}

async function deleteById(saleId, hotelId) {
  validateUUID(saleId)
  validateUUID(hotelId)

  await database.query({
    text: `
    DELETE FROM sales
    WHERE hotel_id = $1 and id = $2
    `,
    values: [hotelId, saleId],
  })
}

const sale = {
  create,
  findOneById,
  findAllByHotelId,
  update,
  deleteById,
}

export default sale
