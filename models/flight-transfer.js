import database from "infra/database.js"
import { ValidationError, NotFoundError } from "infra/errors.js"
import { validateUUID } from "infra/validator.js"
import { sendFlightTransferEmail } from "models/email-notifications.js"

async function create(flightData, userId) {
  if (!userId) {
    throw new ValidationError({
      message: "Usuário não autenticado.",
      action: "Faça login para cadastrar as informações de voo.",
    })
  }

  // Support both batch participants array and single participant object
  let participantsToInsert = []

  if (
    Array.isArray(flightData.participants) &&
    flightData.participants.length > 0
  ) {
    participantsToInsert = flightData.participants
  } else if (
    flightData.participant_name &&
    flightData.participant_name.trim()
  ) {
    participantsToInsert = [
      {
        participant_name: flightData.participant_name.trim(),
        participant_cpf: flightData.participant_cpf || null,
        participant_email: flightData.participant_email || null,
        participant_phone: flightData.participant_phone || null,
        company_name: flightData.company_name || null,
        sale_id: flightData.sale_id || null,
        guest_id: flightData.guest_id || null,
      },
    ]
  } else {
    throw new ValidationError({
      message: "O nome do participante é obrigatório.",
      action: "Informe o nome do participante e tente novamente.",
    })
  }

  // Resolve hotel_id (from payload, or active hotel)
  let hotelId = flightData.hotel_id
  let hotelName = ""

  if (hotelId) {
    validateUUID(hotelId)
    const hotelCheck = await database.query({
      text: "SELECT id, name FROM hotels WHERE id = $1 LIMIT 1",
      values: [hotelId],
    })
    if (hotelCheck.rowCount > 0) {
      hotelName = hotelCheck.rows[0].name
    }
  } else {
    const activeHotelQuery = await database.query({
      text: "SELECT id, name FROM hotels WHERE active = true LIMIT 1",
    })
    if (activeHotelQuery.rowCount > 0) {
      hotelId = activeHotelQuery.rows[0].id
      hotelName = activeHotelQuery.rows[0].name
    } else {
      const fallbackHotel = await database.query({
        text: "SELECT id, name FROM hotels ORDER BY created_at DESC LIMIT 1",
      })
      if (fallbackHotel.rowCount > 0) {
        hotelId = fallbackHotel.rows[0].id
        hotelName = fallbackHotel.rows[0].name
      } else {
        throw new ValidationError({
          message: "Nenhum hotel encontrado no sistema.",
          action: "Cadastre um hotel antes de registrar informações de voo.",
        })
      }
    }
  }

  const {
    // Voo Ida (IN)
    in_date = null,
    in_airline = null,
    in_locator = null,
    in_flight_number = null,
    in_origin_airport = null,
    in_arrival_time = null,
    in_destination_airport = null,
    // Voo Volta (OUT)
    out_date = null,
    out_airline = null,
    out_locator = null,
    out_flight_number = null,
    out_departure_airport = null,
    out_departure_time = null,
    out_destination_airport = null,
    notes = null,
  } = flightData

  const insertedRecords = []

  for (const p of participantsToInsert) {
    let resolvedGuestId = p.guest_id || null
    let resolvedSaleId = p.sale_id || null

    if (!resolvedGuestId && p.participant_cpf) {
      const cleanCpf = p.participant_cpf.replace(/\D/g, "")
      const guestSearch = await database.query({
        text: `
          SELECT sg.guest_id, sg.sale_id 
          FROM guests g 
          JOIN sales_guests sg ON g.id = sg.guest_id
          JOIN sales s ON sg.sale_id = s.id
          WHERE s.status != 'cancelled' 
            AND (
              (LENGTH($1) > 0 AND REGEXP_REPLACE(g.cpf_number, '\\D', '', 'g') = $1)
              OR (LOWER(TRIM(g.passport_number)) = LOWER(TRIM($2)))
            )
          LIMIT 1
        `,
        values: [cleanCpf, p.participant_cpf.trim()],
      })

      if (guestSearch.rowCount > 0) {
        resolvedGuestId = guestSearch.rows[0].guest_id
        resolvedSaleId = resolvedSaleId || guestSearch.rows[0].sale_id
      }
    }

    const query = `
      INSERT INTO flight_transfers (
        hotel_id,
        user_id,
        sale_id,
        guest_id,
        participant_name,
        participant_cpf,
        participant_email,
        participant_phone,
        company_name,
        in_date,
        in_airline,
        in_locator,
        in_flight_number,
        in_origin_airport,
        in_arrival_time,
        in_destination_airport,
        out_date,
        out_airline,
        out_locator,
        out_flight_number,
        out_departure_airport,
        out_departure_time,
        out_destination_airport,
        notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23,
        $24
      )
      RETURNING *
    `

    const in_date = p.in_date !== undefined ? p.in_date : flightData.in_date
    const in_airline =
      p.in_airline !== undefined ? p.in_airline : flightData.in_airline
    const in_locator =
      p.in_locator !== undefined ? p.in_locator : flightData.in_locator
    const in_flight_number =
      p.in_flight_number !== undefined
        ? p.in_flight_number
        : flightData.in_flight_number
    const in_origin_airport =
      p.in_origin_airport !== undefined
        ? p.in_origin_airport
        : flightData.in_origin_airport
    const in_arrival_time =
      p.in_arrival_time !== undefined
        ? p.in_arrival_time
        : flightData.in_arrival_time
    const in_destination_airport =
      p.in_destination_airport !== undefined
        ? p.in_destination_airport
        : flightData.in_destination_airport
    const out_date = p.out_date !== undefined ? p.out_date : flightData.out_date
    const out_airline =
      p.out_airline !== undefined ? p.out_airline : flightData.out_airline
    const out_locator =
      p.out_locator !== undefined ? p.out_locator : flightData.out_locator
    const out_flight_number =
      p.out_flight_number !== undefined
        ? p.out_flight_number
        : flightData.out_flight_number
    const out_departure_airport =
      p.out_departure_airport !== undefined
        ? p.out_departure_airport
        : flightData.out_departure_airport
    const out_departure_time =
      p.out_departure_time !== undefined
        ? p.out_departure_time
        : flightData.out_departure_time
    const out_destination_airport =
      p.out_destination_airport !== undefined
        ? p.out_destination_airport
        : flightData.out_destination_airport
    const notes = p.notes !== undefined ? p.notes : flightData.notes

    const values = [
      hotelId,
      userId,
      resolvedSaleId || null,
      resolvedGuestId || null,
      (p.participant_name || "").trim(),
      p.participant_cpf ? p.participant_cpf.trim() : null,
      p.participant_email ? p.participant_email.trim() : null,
      p.participant_phone ? p.participant_phone.trim() : null,
      p.company_name ? p.company_name.trim() : null,
      in_date || null,
      in_airline ? in_airline.trim() : null,
      in_locator ? in_locator.trim().toUpperCase() : null,
      in_flight_number ? in_flight_number.trim() : null,
      in_origin_airport ? in_origin_airport.trim() : null,
      in_arrival_time ? in_arrival_time.trim() : null,
      in_destination_airport ? in_destination_airport.trim() : null,
      out_date || null,
      out_airline ? out_airline.trim() : null,
      out_locator ? out_locator.trim().toUpperCase() : null,
      out_flight_number ? out_flight_number.trim() : null,
      out_departure_airport ? out_departure_airport.trim() : null,
      out_departure_time ? out_departure_time.trim() : null,
      out_destination_airport ? out_destination_airport.trim() : null,
      notes ? notes.trim() : null,
    ]

    const result = await database.query({ text: query, values })
    insertedRecords.push(result.rows[0])
  }

  // Enviar e-mail de notificação para a logística (consolidado)
  await sendFlightTransferEmail({
    ...insertedRecords[0],
    hotel_name: hotelName,
    participants: insertedRecords.map((rec) => ({
      name: rec.participant_name,
      cpf: rec.participant_cpf,
      email: rec.participant_email,
      phone: rec.participant_phone,
      company: rec.company_name,
    })),
  })

  return insertedRecords.length === 1 ? insertedRecords[0] : insertedRecords
}

async function findByUserId(userId) {
  if (!userId) return []
  validateUUID(userId)

  const query = `
    SELECT 
      ft.*,
      h.name as hotel_name,
      s.sale_number
    FROM flight_transfers ft
    LEFT JOIN hotels h ON ft.hotel_id = h.id
    LEFT JOIN sales s ON ft.sale_id = s.id
    WHERE ft.user_id = $1
    ORDER BY ft.created_at DESC
  `

  const result = await database.query({
    text: query,
    values: [userId],
  })

  return result.rows
}

async function findById(id) {
  validateUUID(id)

  const query = `
    SELECT 
      ft.*,
      h.name as hotel_name,
      s.sale_number
    FROM flight_transfers ft
    LEFT JOIN hotels h ON ft.hotel_id = h.id
    LEFT JOIN sales s ON ft.sale_id = s.id
    WHERE ft.id = $1
    LIMIT 1
  `

  const result = await database.query({
    text: query,
    values: [id],
  })

  if (result.rowCount === 0) {
    throw new NotFoundError({
      message: "Registro de voo/transfer não encontrado.",
      action: "Verifique o ID informado.",
    })
  }

  return result.rows[0]
}

async function deleteById(id, userId, userFeatures = []) {
  validateUUID(id)
  validateUUID(userId)

  const isAdm =
    userFeatures.includes("delete:sale:others") ||
    userFeatures.includes("admin")

  let query
  let values

  if (isAdm) {
    query = `DELETE FROM flight_transfers WHERE id = $1 RETURNING *`
    values = [id]
  } else {
    query = `DELETE FROM flight_transfers WHERE id = $1 AND user_id = $2 RETURNING *`
    values = [id, userId]
  }

  const result = await database.query({ text: query, values })

  if (result.rowCount === 0) {
    throw new NotFoundError({
      message: "Registro de voo não encontrado ou sem permissão para cancelar.",
      action: "Verifique o registro e tente novamente.",
    })
  }

  return result.rows[0]
}

async function getUserDefaults(userId) {
  if (!userId) return null
  validateUUID(userId)

  // 1. Get active hotel (or fallback)
  const hotelQuery = await database.query({
    text: "SELECT id, name, city, check_in_date, check_out_date FROM hotels WHERE active = true LIMIT 1",
  })
  let activeHotel = hotelQuery.rows[0] || null

  if (!activeHotel) {
    const fallbackHotelQuery = await database.query({
      text: "SELECT id, name, city, check_in_date, check_out_date FROM hotels ORDER BY created_at DESC LIMIT 1",
    })
    activeHotel = fallbackHotelQuery.rows[0] || null
  }

  // 2. Get user info
  const userQuery = await database.query({
    text: "SELECT id, full_name, email FROM users WHERE id = $1 LIMIT 1",
    values: [userId],
  })
  const userData = userQuery.rows[0] || {}

  // 3. Get guests from user's active sales
  const salesQuery = await database.query({
    text: `
      SELECT 
        s.id as sale_id,
        s.sale_number,
        g.id as guest_id,
        g.name as guest_name,
        g.cpf_number as guest_cpf,
        g.passport_number as guest_passport,
        g.phone as guest_phone,
        g.email as guest_email,
        c.corporate_name as company_name
      FROM sales s
      JOIN sales_guests sg ON s.id = sg.sale_id
      JOIN guests g ON sg.guest_id = g.id
      LEFT JOIN companies c ON s.company_id = c.id
      WHERE s.user_id = $1 AND s.status != 'cancelled'
      ORDER BY s.sale_number ASC, g.name ASC
    `,
    values: [userId],
  })

  // 4. Get grouped sales with room and guests list
  const groupedSalesQuery = await database.query({
    text: `
      SELECT 
        s.id as sale_id,
        s.sale_number,
        r.name as room_name,
        c.corporate_name as company_name,
        json_agg(
          json_build_object(
            'guest_id', g.id,
            'name', g.name,
            'cpf_number', g.cpf_number,
            'passport_number', g.passport_number,
            'phone', g.phone,
            'email', g.email
          ) ORDER BY g.name ASC
        ) as guests
      FROM sales s
      JOIN rooms r ON s.room_id = r.id
      JOIN sales_guests sg ON s.id = sg.sale_id
      JOIN guests g ON sg.guest_id = g.id
      LEFT JOIN companies c ON s.company_id = c.id
      WHERE s.user_id = $1 AND s.status != 'cancelled'
      GROUP BY s.id, s.sale_number, r.name, c.corporate_name
      ORDER BY s.sale_number ASC
    `,
    values: [userId],
  })

  return {
    hotel: activeHotel,
    user: userData,
    available_participants: salesQuery.rows,
    sales_with_guests: groupedSalesQuery.rows,
  }
}

const flightTransfer = {
  create,
  findByUserId,
  findById,
  deleteById,
  getUserDefaults,
}

export default flightTransfer
