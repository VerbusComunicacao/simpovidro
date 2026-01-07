import database from "infra/database.js"
import { ValidationError, NotFoundError } from "infra/errors.js"
import { validateRequiredFields, validateUUID } from "infra/validator.js"
import { v4 as uuidv4 } from "uuid"

async function create(saleInputValues, hotelId) {
  validateRequiredFields(saleInputValues, [
    "guest_id",
    "room_id",
    "check_in_date",
    "check_out_date",
    "total_amount",
  ])

  const newSale = await runInsertQuery(saleInputValues, hotelId)
  return newSale

  async function runInsertQuery(saleInputValues, hotelId) {
    const {
      guest_id,
      room_id,
      check_in_date,
      check_out_date,
      total_amount,
      company_id = null,
    } = saleInputValues

    const sale_number = uuidv4()
    const final_amount = total_amount

    const results = await database.query({
      text: `
        INSERT INTO
          sales (hotel_id, guest_id, room_id, check_in_date, check_out_date, total_amount, final_amount, sale_number, company_id)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING
          *
      `,
      values: [
        hotelId,
        guest_id,
        room_id,
        check_in_date,
        check_out_date,
        total_amount,
        final_amount,
        sale_number,
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

async function findAllByGuestId(guestId) {
  const results = await database.query({
    text: `
      SELECT 
        sales.*,
        hotels.name as hotel_name,
        rooms.name as room_name,
        "room-types".name as room_type,
        "room-categories".name as room_category
      FROM 
        sales
      JOIN
        hotels ON sales.hotel_id = hotels.id
      JOIN
        rooms ON sales.room_id = rooms.id
      JOIN
        "room-types" ON rooms.room_type_id = "room-types".id
      JOIN
        "room-categories" ON rooms.room_category_id = "room-categories".id
      WHERE 
        sales.guest_id = $1
      ORDER BY 
        sales.created_at DESC
    `,
    values: [guestId],
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
      "total_amount",
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
      total_amount,
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
          total_amount = $6,
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
        total_amount,
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
  findAllByGuestId,
  update,
  deleteById,
}

export default sale
