import database from "infra/database.js"
import { ValidationError, NotFoundError } from "infra/errors.js"
import { validateUUID } from "infra/validator.js"

const DEFAULT_LUNCHES = [
  {
    title: "Energia",
    speakers: "Jean Vinicius Tremura, Carlos Alberto Schoeps",
  },
  {
    title: "Mercado Global",
    speakers: "Davide Cappellino (AGC), Leopoldo Castiella (NSG)",
  },
  {
    title: "Inteligência Artificial",
    speakers: "Tiago Amor, Aristóteles Terceiro Neto, Betânia Danelon",
  },
  {
    title: "Reforma Tributária",
    speakers: "Lucilene Prado, Halim José Abud Neto",
  },
  {
    title: "Clínica de Gestão e Mudança, Além do Vidro",
    speakers: "Rodrigo Fontana",
  },
]

async function findAllByHotelId(hotelId, options = {}) {
  const { includeInactive = false } = options
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

  const activeFilter = includeInactive ? "" : "AND l.active = true"

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
      WHERE l.hotel_id = $1 ${activeFilter}
      GROUP BY l.id
      ORDER BY l.created_at ASC
    `,
    values: [resolvedHotelId],
  })

  if (result.rowCount === 0 && !includeInactive) {
    for (const item of DEFAULT_LUNCHES) {
      await database.query({
        text: `
          INSERT INTO lunches (hotel_id, title, speakers, active)
          VALUES ($1, $2, $3, true)
        `,
        values: [resolvedHotelId, item.title, item.speakers],
      })
    }

    const recheck = await database.query({
      text: `
        SELECT 
          l.id,
          l.hotel_id,
          l.title,
          l.speakers,
          l.active,
          l.created_at,
          0 as registered_count
        FROM lunches l
        WHERE l.hotel_id = $1 AND l.active = true
        ORDER BY l.created_at ASC
      `,
      values: [resolvedHotelId],
    })

    return recheck.rows
  }

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
  let { hotel_id, title, speakers, active = true } = lunchData || {}

  if (!hotel_id) {
    const activeHotel = await database.query({
      text: "SELECT id FROM hotels WHERE active = true LIMIT 1",
    })
    if (activeHotel.rowCount > 0) {
      hotel_id = activeHotel.rows[0].id
    } else {
      const fallbackHotel = await database.query({
        text: "SELECT id FROM hotels ORDER BY created_at DESC LIMIT 1",
      })
      if (fallbackHotel.rowCount > 0) {
        hotel_id = fallbackHotel.rows[0].id
      }
    }
  }

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
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    values: [hotel_id, title.trim(), speakers.trim(), Boolean(active)],
  })

  return result.rows[0]
}

async function update(lunchId, lunchData) {
  validateUUID(lunchId)

  // Verify lunch exists
  await findById(lunchId)

  const { title, speakers, active } = lunchData || {}

  const updates = []
  const values = []
  let paramIndex = 1

  if (title !== undefined) {
    if (!title || !title.trim()) {
      throw new ValidationError({
        message: "O título da mesa não pode ser vazio.",
        action: "Informe um título válido e tente novamente.",
      })
    }
    updates.push(`title = $${paramIndex++}`)
    values.push(title.trim())
  }

  if (speakers !== undefined) {
    if (!speakers || !speakers.trim()) {
      throw new ValidationError({
        message: "Os convidados/painelistas não podem ser vazios.",
        action: "Informe ao menos um convidado e tente novamente.",
      })
    }
    updates.push(`speakers = $${paramIndex++}`)
    values.push(speakers.trim())
  }

  if (active !== undefined) {
    updates.push(`active = $${paramIndex++}`)
    values.push(Boolean(active))
  }

  if (updates.length === 0) {
    return await findById(lunchId)
  }

  updates.push(`updated_at = timezone('utc', now())`)
  values.push(lunchId)

  const result = await database.query({
    text: `
      UPDATE lunches
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `,
    values,
  })

  return result.rows[0]
}

async function deleteById(lunchId) {
  validateUUID(lunchId)

  // Verify lunch exists
  await findById(lunchId)

  const result = await database.query({
    text: `
      DELETE FROM lunches
      WHERE id = $1
      RETURNING *
    `,
    values: [lunchId],
  })

  return result.rows[0]
}

const lunch = {
  findAllByHotelId,
  findById,
  create,
  update,
  deleteById,
}

export default lunch
