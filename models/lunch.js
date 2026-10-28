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
        TO_CHAR(l.lunch_date, 'YYYY-MM-DD') AS lunch_date,
        TO_CHAR(l.lunch_time, 'HH24:MI') AS lunch_time,
        COUNT(lr.id)::int as registered_count
      FROM lunches l
      LEFT JOIN lunch_registrations lr ON l.id = lr.lunch_id
      WHERE l.hotel_id = $1 ${activeFilter}
      GROUP BY l.id
      ORDER BY l.lunch_date ASC NULLS LAST, l.lunch_time ASC NULLS LAST, l.created_at ASC
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
          TO_CHAR(l.lunch_date, 'YYYY-MM-DD') AS lunch_date,
          TO_CHAR(l.lunch_time, 'HH24:MI') AS lunch_time,
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

const LUNCH_RETURNING = `
  id, hotel_id, title, speakers, active, created_at, updated_at,
  TO_CHAR(lunch_date, 'YYYY-MM-DD') AS lunch_date,
  TO_CHAR(lunch_time, 'HH24:MI') AS lunch_time`

function normalizeLunchDate(value) {
  if (value === undefined) return undefined
  if (value === null || value === "") return null

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value))
  const date = match && new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]))
  if (
    !date ||
    date.getUTCFullYear() !== +match[1] ||
    date.getUTCMonth() !== +match[2] - 1 ||
    date.getUTCDate() !== +match[3]
  ) {
    throw new ValidationError({
      message: "A data do almoço é inválida.",
      action: "Informe a data no formato AAAA-MM-DD, por exemplo 2026-11-06.",
    })
  }
  return String(value)
}

function normalizeLunchTime(value) {
  if (value === undefined) return undefined
  if (value === null || value === "") return null

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(value))) {
    throw new ValidationError({
      message: "O horário do almoço é inválido.",
      action: "Informe o horário no formato HH:MM, por exemplo 13:00.",
    })
  }
  return String(value)
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
        TO_CHAR(l.lunch_date, 'YYYY-MM-DD') AS lunch_date,
        TO_CHAR(l.lunch_time, 'HH24:MI') AS lunch_time,
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
  let {
    hotel_id,
    title,
    speakers,
    active = true,
    lunch_date,
    lunch_time,
  } = lunchData || {}

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

  const normalizedDate = normalizeLunchDate(lunch_date) ?? null
  const normalizedTime = normalizeLunchTime(lunch_time) ?? null

  const result = await database.query({
    text: `
      INSERT INTO lunches (
        hotel_id,
        title,
        speakers,
        active,
        lunch_date,
        lunch_time
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING ${LUNCH_RETURNING}
    `,
    values: [
      hotel_id,
      title.trim(),
      speakers.trim(),
      Boolean(active),
      normalizedDate,
      normalizedTime,
    ],
  })

  return result.rows[0]
}

async function update(lunchId, lunchData) {
  validateUUID(lunchId)

  // Verify lunch exists
  await findById(lunchId)

  const { title, speakers, active, lunch_date, lunch_time } = lunchData || {}

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

  const normalizedDate = normalizeLunchDate(lunch_date)
  if (normalizedDate !== undefined) {
    updates.push(`lunch_date = $${paramIndex++}`)
    values.push(normalizedDate)
  }

  const normalizedTime = normalizeLunchTime(lunch_time)
  if (normalizedTime !== undefined) {
    updates.push(`lunch_time = $${paramIndex++}`)
    values.push(normalizedTime)
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
      RETURNING ${LUNCH_RETURNING}
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

async function getSettings(hotelId = null) {
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
    return {
      hotel_id: null,
      allow_multiple_lunches: true,
      max_lunches_per_guest: null,
    }
  }

  try {
    const result = await database.query({
      text: "SELECT id, allow_multiple_lunches, max_lunches_per_guest FROM hotels WHERE id = $1",
      values: [resolvedHotelId],
    })

    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: "Hotel não encontrado.",
        action: "Verifique o hotel informado.",
      })
    }

    const row = result.rows[0]
    return {
      hotel_id: row.id,
      allow_multiple_lunches: row.allow_multiple_lunches !== false,
      max_lunches_per_guest: row.max_lunches_per_guest || null,
    }
  } catch (err) {
    return {
      hotel_id: resolvedHotelId,
      allow_multiple_lunches: true,
      max_lunches_per_guest: null,
    }
  }
}

async function updateSettings(hotelId = null, data = {}) {
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
    throw new ValidationError({
      message: "Nenhum hotel ativo encontrado para atualizar configurações.",
      action: "Cadastre um hotel antes de alterar configurações.",
    })
  }

  const allowMultiple =
    data.allow_multiple_lunches !== undefined
      ? Boolean(data.allow_multiple_lunches)
      : true

  let maxLunches = null
  if (
    data.max_lunches_per_guest !== undefined &&
    data.max_lunches_per_guest !== null &&
    data.max_lunches_per_guest !== ""
  ) {
    maxLunches = parseInt(data.max_lunches_per_guest, 10)
    if (isNaN(maxLunches) || maxLunches < 1) {
      maxLunches = null
    }
  }

  const updateResult = await database.query({
    text: `
      UPDATE hotels
      SET 
        allow_multiple_lunches = $1,
        max_lunches_per_guest = $2,
        updated_at = timezone('utc', now())
      WHERE id = $3
      RETURNING id, allow_multiple_lunches, max_lunches_per_guest
    `,
    values: [allowMultiple, maxLunches, resolvedHotelId],
  })

  if (updateResult.rowCount === 0) {
    throw new NotFoundError({
      message: "Hotel não encontrado para atualizar configurações.",
      action: "Verifique o identificador do hotel e tente novamente.",
    })
  }

  const row = updateResult.rows[0]
  return {
    hotel_id: row.id,
    allow_multiple_lunches: row.allow_multiple_lunches !== false,
    max_lunches_per_guest: row.max_lunches_per_guest || null,
  }
}

const lunch = {
  findAllByHotelId,
  findById,
  create,
  update,
  deleteById,
  getSettings,
  updateSettings,
}

export default lunch
