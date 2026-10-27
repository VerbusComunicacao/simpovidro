import database from "infra/database.js"
import { ValidationError, NotFoundError } from "infra/errors.js"
import { validateUUID } from "infra/validator.js"

async function findAllByHotelId(hotelId) {
  let resolvedHotelId = hotelId

  if (resolvedHotelId) {
    validateUUID(resolvedHotelId)
  } else {
    const activeHotel = await database.query({
      text: "SELECT id FROM hotels WHERE active = true LIMIT 1",
    })
    if (activeHotel.rowCount > 0) {
      resolvedHotelId = activeHotel.rows[0].id
    } else {
      const fallbackHotel = await database.query({
        text: "SELECT id FROM hotels ORDER BY created_at DESC LIMIT 1",
      })
      if (fallbackHotel.rowCount > 0) {
        resolvedHotelId = fallbackHotel.rows[0].id
      }
    }
  }

  if (!resolvedHotelId) {
    return []
  }

  const result = await database.query({
    text: `
      SELECT 
        l.id,
        l.hotel_id,
        l.title,
        l.speakers,
        l.active,
        l.created_at,
        COUNT(lr.id)::int as registered_count
      FROM lunches l
      LEFT JOIN lunch_registrations lr ON l.id = lr.lunch_id
      WHERE l.hotel_id = $1 AND l.active = true
      GROUP BY l.id
      ORDER BY l.created_at ASC
    `,
    values: [resolvedHotelId],
  })

  return result.rows
}

async function findById(lunchId) {
  validateUUID(lunchId)

  const result = await database.query({
    text: `
      SELECT 
        l.id,
        l.hotel_id,
        l.title,
        l.speakers,
        l.active,
        l.created_at,
        COUNT(lr.id)::int as registered_count
      FROM lunches l
      LEFT JOIN lunch_registrations lr ON l.id = lr.lunch_id
      WHERE l.id = $1
      GROUP BY l.id
      LIMIT 1
    `,
    values: [lunchId],
  })

  if (result.rowCount === 0) {
    throw new NotFoundError({
      message: "Mesa de almoço não encontrada.",
      action: "Verifique o identificador e tente novamente.",
    })
  }

  return result.rows[0]
}

async function create(lunchData) {
  const { hotel_id, title, speakers } = lunchData || {}

  if (!hotel_id) {
    throw new ValidationError({
      message: "O hotel_id é obrigatório para cadastrar uma mesa.",
      action: "Informe o hotel e tente novamente.",
    })
  }
  validateUUID(hotel_id)

  if (!title || !title.trim()) {
    throw new ValidationError({
      message: "O título da mesa é obrigatório.",
      action: "Informe o título e tente novamente.",
    })
  }

  if (!speakers || !speakers.trim()) {
    throw new ValidationError({
      message: "Os palestrantes/convidados são obrigatórios.",
      action: "Informe ao menos um convidado/palestrante.",
    })
  }

  const result = await database.query({
    text: `
      INSERT INTO lunches (
        hotel_id,
        title,
        speakers,
        active
      ) VALUES ($1, $2, $3, true)
      RETURNING *
    `,
    values: [hotel_id, title.trim(), speakers.trim()],
  })

  return result.rows[0]
}

const lunch = {
  findAllByHotelId,
  findById,
  create,
}

export default lunch
