import database from "infra/database.js"
import { ValidationError, NotFoundError } from "infra/errors.js"
import { validateUUID } from "infra/validator.js"
import lunch from "models/lunch.js"

async function lookupParticipant(document) {
  if (!document || !document.toString().trim()) {
    throw new ValidationError({
      message: "Informe o CPF ou Passaporte para continuar.",
      action: "Digite um documento válido e tente novamente.",
    })
  }

  const raw = document.toString().trim()
  const cleanCpf = raw.replace(/\D/g, "")
  const cleanAlphaNum = raw.toLowerCase().replace(/[^a-z0-9]/g, "")
  const isLikelyCpf = cleanCpf.length === 11

  // 1. Resolve active hotel
  let activeHotel = null
  const activeHotelQuery = await database.query({
    text: "SELECT id, name FROM hotels WHERE active = true LIMIT 1",
  })
  if (activeHotelQuery.rowCount > 0) {
    activeHotel = activeHotelQuery.rows[0]
  } else {
    const fallbackHotel = await database.query({
      text: "SELECT id, name FROM hotels ORDER BY created_at DESC LIMIT 1",
    })
    if (fallbackHotel.rowCount > 0) {
      activeHotel = fallbackHotel.rows[0]
    }
  }

  if (!activeHotel) {
    throw new ValidationError({
      message: "Nenhum evento/hotel ativo cadastrado no sistema.",
      action: "Aguarde a abertura oficial ou contate a organização.",
    })
  }

  // 2. Search in guests of non-cancelled sales in the active hotel
  const guestQuery = await database.query({
    text: `
      SELECT 
        g.id as guest_id,
        g.name as participant_name,
        g.cpf_number as participant_cpf,
        g.passport_number,
        g.email as participant_email,
        g.phone as participant_phone,
        COALESCE(c.corporate_name, '') as company_name,
        s.id as sale_id,
        s.sale_number,
        COALESCE(g.user_id, s.user_id) as user_id,
        s.hotel_id,
        h.name as hotel_name
      FROM guests g
      JOIN sales_guests sg ON g.id = sg.guest_id
      JOIN sales s ON sg.sale_id = s.id AND s.status != 'cancelled'
      JOIN hotels h ON s.hotel_id = h.id
      LEFT JOIN companies c ON s.company_id = c.id
      WHERE 
        s.hotel_id = $4
        AND (
          (LENGTH($1) = 11 AND REGEXP_REPLACE(COALESCE(g.cpf_number, ''), '\\D', '', 'g') = $1)
          OR (LENGTH($2) > 0 AND LOWER(TRIM(COALESCE(g.passport_number, ''))) = LOWER(TRIM($2)))
          OR (LENGTH($3) > 0 AND REGEXP_REPLACE(LOWER(COALESCE(g.passport_number, '')), '[^a-z0-9]', '', 'g') = $3)
          OR (LENGTH($1) > 0 AND REGEXP_REPLACE(COALESCE(g.passport_number, ''), '\\D', '', 'g') = $1)
          OR (LENGTH($1) > 0 AND REGEXP_REPLACE(COALESCE(g.cpf_number, ''), '\\D', '', 'g') = $1)
        )
      ORDER BY s.created_at DESC
      LIMIT 1
    `,
    values: [cleanCpf, raw, cleanAlphaNum, activeHotel.id],
  })

  if (guestQuery.rowCount === 0) {
    return {
      found: false,
      message:
        "Nenhuma inscrição confirmada encontrada para este documento no 17º Simpovidro. Verifique o CPF/Passaporte digitado ou contate a organização em logistica@abravidro.org.br.",
      document: raw,
      document_type: isLikelyCpf ? "cpf" : "passport",
      hotel: activeHotel,
    }
  }

  const participant = guestQuery.rows[0]

  // 3. Check for existing lunch registrations
  const existingRegistrations = []
  const regQuery = await database.query({
    text: `
      SELECT 
        lr.id,
        lr.lunch_id,
        lr.guest_id,
        lr.sale_id,
        lr.created_at,
        lr.updated_at,
        l.title as lunch_title,
        l.speakers as lunch_speakers
      FROM lunch_registrations lr
      JOIN lunches l ON lr.lunch_id = l.id
      WHERE lr.guest_id = $1
      ORDER BY lr.created_at ASC
    `,
    values: [participant.guest_id],
  })

  for (const reg of regQuery.rows) {
    const posQuery = await database.query({
      text: `
        SELECT COUNT(*)::int as position
        FROM lunch_registrations
        WHERE lunch_id = $1 AND created_at <= (
          SELECT created_at FROM lunch_registrations WHERE id = $2
        )
      `,
      values: [reg.lunch_id, reg.id],
    })
    existingRegistrations.push({
      ...reg,
      position: posQuery.rows[0]?.position || 1,
    })
  }

  const existingRegistration = existingRegistrations[0] || null

  // 4. Fetch available lunches for this hotel
  const availableLunches = await lunch.findAllByHotelId(activeHotel.id)
  const settings = await lunch.getSettings(activeHotel.id)

  const isCpf =
    Boolean(participant.participant_cpf) &&
    cleanCpf.length === 11 &&
    participant.participant_cpf.replace(/\D/g, "") === cleanCpf

  return {
    found: true,
    document: raw,
    document_type: isCpf ? "cpf" : "passport",
    hotel: activeHotel,
    settings,
    participant: {
      user_id: participant.user_id,
      guest_id: participant.guest_id,
      sale_id: participant.sale_id,
      sale_number: participant.sale_number,
      participant_name: participant.participant_name,
      participant_cpf: participant.participant_cpf || "",
      passport_number: participant.passport_number || "",
      participant_email: participant.participant_email || "",
      participant_phone: participant.participant_phone || "",
      company_name: participant.company_name || "",
    },
    available_lunches: availableLunches,
    existing_registration: existingRegistration,
    existing_registrations: existingRegistrations,
  }
}

async function registerOrUpdate({ guest_id, sale_id, lunch_id, lunch_ids }) {
  if (!guest_id) {
    throw new ValidationError({
      message: "Identificador do participante (guest_id) é obrigatório.",
      action: "Selecione um participante válido.",
    })
  }
  validateUUID(guest_id)

  if (!sale_id) {
    throw new ValidationError({
      message: "Identificador da inscrição (sale_id) é obrigatório.",
      action: "Selecione uma inscrição válida.",
    })
  }
  validateUUID(sale_id)

  // 1. Verify guest is linked to sale
  const relationCheck = await database.query({
    text: `
      SELECT sg.id, s.hotel_id 
      FROM sales_guests sg
      JOIN sales s ON sg.sale_id = s.id
      WHERE sg.guest_id = $1 AND sg.sale_id = $2 AND s.status != 'cancelled'
      LIMIT 1
    `,
    values: [guest_id, sale_id],
  })

  if (relationCheck.rowCount === 0) {
    throw new ValidationError({
      message: "Participante não está vinculado a uma inscrição válida.",
      action: "Verifique os dados informados e tente novamente.",
    })
  }

  const hotelId = relationCheck.rows[0].hotel_id
  const settings = await lunch.getSettings(hotelId)
  const allowMultiple = settings.allow_multiple_lunches !== false
  const maxAllowed =
    settings.max_lunches_per_guest || (allowMultiple ? null : 1)

  // 2. Resolve target lunch IDs
  const isMultiMode = Array.isArray(lunch_ids)
  let targetIds = []
  if (isMultiMode) {
    targetIds = lunch_ids.filter(Boolean)
  } else if (lunch_id) {
    targetIds = [lunch_id]
  }

  if (targetIds.length === 0) {
    if (isMultiMode) {
      // User submitted an empty list, remove all existing registrations
      await database.query({
        text: `DELETE FROM lunch_registrations WHERE guest_id = $1`,
        values: [guest_id],
      })
      return {
        registrations: [],
        registered_lunch_ids: [],
        registration: null,
        position: 0,
        lunch: null,
      }
    }
    throw new ValidationError({
      message: "Selecione pelo menos uma mesa de almoço.",
      action: "Escolha uma das mesas disponíveis para continuar.",
    })
  }

  if (!allowMultiple && targetIds.length > 1) {
    throw new ValidationError({
      message: "O evento permite a inscrição em apenas 1 mesa temática.",
      action: "Selecione apenas uma mesa para continuar.",
    })
  }

  if (maxAllowed && targetIds.length > maxAllowed) {
    throw new ValidationError({
      message: `O evento permite a inscrição em no máximo ${maxAllowed} mesa(s).`,
      action: `Selecione no máximo ${maxAllowed} mesa(s) e tente novamente.`,
    })
  }

  if (!allowMultiple && targetIds.length === 1) {
    // In single mode, ensure any existing registrations for other tables are removed
    await database.query({
      text: `DELETE FROM lunch_registrations WHERE guest_id = $1 AND lunch_id != $2`,
      values: [guest_id, targetIds[0]],
    })
  }

  // 3. Validate each lunch exists and is active
  const validatedLunches = []
  for (const id of targetIds) {
    validateUUID(id)
    const lunchData = await lunch.findById(id)
    if (!lunchData || !lunchData.active) {
      throw new ValidationError({
        message: `A mesa "${lunchData?.title || id}" não está mais disponível.`,
        action: "Por favor, selecione outra mesa disponível.",
      })
    }
    validatedLunches.push(lunchData)
  }

  // 4. Query current registrations for this guest
  const currentRegQuery = await database.query({
    text: `SELECT id, lunch_id, created_at FROM lunch_registrations WHERE guest_id = $1`,
    values: [guest_id],
  })
  const currentMap = new Map(currentRegQuery.rows.map((r) => [r.lunch_id, r]))

  // In multi mode: remove registrations for tables no longer in targetIds
  if (isMultiMode) {
    const toRemove = currentRegQuery.rows.filter(
      (r) => !targetIds.includes(r.lunch_id),
    )
    for (const r of toRemove) {
      await database.query({
        text: `DELETE FROM lunch_registrations WHERE id = $1`,
        values: [r.id],
      })
    }
  }

  // 5. Insert new or keep existing
  const savedRecords = []
  for (const lunchData of validatedLunches) {
    let rec = currentMap.get(lunchData.id)

    if (!rec) {
      const insertResult = await database.query({
        text: `
          INSERT INTO lunch_registrations (
            lunch_id,
            guest_id,
            sale_id
          ) VALUES ($1, $2, $3)
          RETURNING *
        `,
        values: [lunchData.id, guest_id, sale_id],
      })
      rec = insertResult.rows[0]
    } else {
      // Update sale_id and updated_at
      const updateResult = await database.query({
        text: `
          UPDATE lunch_registrations
          SET 
            sale_id = $1,
            updated_at = timezone('utc', now())
          WHERE id = $2
          RETURNING *
        `,
        values: [sale_id, rec.id],
      })
      rec = updateResult.rows[0]
    }

    // Calculate queue position for this table
    const posQuery = await database.query({
      text: `
        SELECT COUNT(*)::int as position
        FROM lunch_registrations
        WHERE lunch_id = $1 AND created_at <= (
          SELECT created_at FROM lunch_registrations WHERE id = $2
        )
      `,
      values: [rec.lunch_id, rec.id],
    })

    savedRecords.push({
      ...rec,
      position: posQuery.rows[0]?.position || 1,
      lunch: lunchData,
    })
  }

  return {
    registrations: savedRecords,
    registered_lunch_ids: savedRecords.map((r) => r.lunch_id),
    registration: savedRecords[0] || null,
    position: savedRecords[0]?.position || 1,
    lunch: savedRecords[0]?.lunch || null,
  }
}

async function deleteByGuestId(guestId) {
  validateUUID(guestId)

  const result = await database.query({
    text: `
      DELETE FROM lunch_registrations
      WHERE guest_id = $1
      RETURNING *
    `,
    values: [guestId],
  })

  if (result.rowCount === 0) {
    throw new NotFoundError({
      message: "Inscrição de almoço não encontrada para este participante.",
      action: "Verifique o identificador e tente novamente.",
    })
  }

  return result.rows[0]
}

async function deleteByGuestAndLunch(guestId, lunchId) {
  validateUUID(guestId)
  validateUUID(lunchId)

  const result = await database.query({
    text: `
      DELETE FROM lunch_registrations
      WHERE guest_id = $1 AND lunch_id = $2
      RETURNING *
    `,
    values: [guestId, lunchId],
  })

  if (result.rowCount === 0) {
    throw new NotFoundError({
      message:
        "Inscrição de almoço não encontrada para este participante e mesa.",
      action: "Verifique os dados e tente novamente.",
    })
  }

  return result.rows[0]
}

async function deleteById(id) {
  validateUUID(id)

  const result = await database.query({
    text: `
      DELETE FROM lunch_registrations
      WHERE id = $1
      RETURNING *
    `,
    values: [id],
  })

  if (result.rowCount === 0) {
    throw new NotFoundError({
      message: "Inscrição de almoço não encontrada.",
      action: "Verifique o identificador e tente novamente.",
    })
  }

  return result.rows[0]
}

async function listByHotel(hotelId, lunchId = null) {
  let resolvedHotelId = hotelId

  if (resolvedHotelId) {
    validateUUID(resolvedHotelId)
  } else {
    const activeHotel = await database.query({
      text: "SELECT id FROM hotels WHERE active = true LIMIT 1",
    })
    if (activeHotel.rowCount > 0) {
      resolvedHotelId = activeHotel.rows[0].id
    }
  }

  if (!resolvedHotelId) {
    return []
  }

  const values = [resolvedHotelId]
  let lunchFilter = ""

  if (lunchId) {
    validateUUID(lunchId)
    values.push(lunchId)
    lunchFilter = "AND lr.lunch_id = $2"
  }

  const result = await database.query({
    text: `
      SELECT 
        lr.id,
        lr.lunch_id,
        lr.guest_id,
        lr.sale_id,
        lr.created_at,
        ROW_NUMBER() OVER (PARTITION BY lr.lunch_id ORDER BY lr.created_at ASC)::int as position_in_table,
        ROW_NUMBER() OVER (ORDER BY lr.created_at ASC)::int as overall_position,
        l.title as lunch_title,
        l.speakers as lunch_speakers,
        g.name as participant_name,
        g.cpf_number as participant_cpf,
        g.passport_number,
        g.email as participant_email,
        g.phone as participant_phone,
        COALESCE(c.corporate_name, '') as company_name,
        s.sale_number
      FROM lunch_registrations lr
      JOIN lunches l ON lr.lunch_id = l.id
      JOIN guests g ON lr.guest_id = g.id
      JOIN sales s ON lr.sale_id = s.id
      LEFT JOIN companies c ON s.company_id = c.id
      WHERE l.hotel_id = $1 ${lunchFilter}
      ORDER BY lr.created_at ASC
    `,
    values,
  })

  return result.rows
}

const lunchRegistration = {
  lookupParticipant,
  registerOrUpdate,
  deleteByGuestId,
  deleteByGuestAndLunch,
  deleteById,
  listByHotel,
}

export default lunchRegistration
