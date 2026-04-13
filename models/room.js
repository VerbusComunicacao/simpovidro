import database from "infra/database.js"
import { ValidationError, NotFoundError } from "infra/errors.js"
import { validateRequiredFields, validateUUID } from "infra/validator.js"

async function create(roomInputValues, userId) {
  validateRequiredFields(roomInputValues, [
    "hotel_id",
    "room_type_id",
    "room_category_id",
    "price_per_night",
    "total_rooms",
  ])
  validateUUID(roomInputValues.hotel_id)
  validateUUID(roomInputValues.room_type_id)
  validateUUID(roomInputValues.room_category_id)

  await verifyHotelBelongsToUser(roomInputValues.hotel_id, userId)
  await verifyRoomTypeBelongsToUser(roomInputValues.room_type_id, userId)
  await verifyRoomCategoryBelongsToUser(
    roomInputValues.room_category_id,
    userId,
  )

  const newRoom = await runInsertQuery(roomInputValues, userId)

  if (
    roomInputValues.price_policies &&
    Array.isArray(roomInputValues.price_policies)
  ) {
    await syncRoomPricePolicies(newRoom.id, roomInputValues.price_policies)
  }

  return await findOneById(newRoom.id)

  async function runInsertQuery(roomInputValues, userId) {
    const {
      hotel_id,
      room_type_id,
      room_category_id,
      price_per_night,
      total_rooms,
      available_rooms = total_rooms,
      blocked_rooms = 0,
      name,
      description,
      photos,
      member_price_per_night = 0,
    } = roomInputValues

    const results = await database.query({
      text: `
        INSERT INTO
          "rooms" (user_id, hotel_id, room_type_id, room_category_id, price_per_night, member_price_per_night, total_rooms, available_rooms, blocked_rooms, name, description, photos)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING
          *
      `,
      values: [
        userId,
        hotel_id,
        room_type_id,
        room_category_id,
        price_per_night,
        member_price_per_night,
        total_rooms,
        available_rooms,
        blocked_rooms,
        name,
        description,
        photos || [],
      ],
    })

    return results.rows[0]
  }
}

async function findOneById(roomId) {
  validateUUID(roomId)
  const roomFound = await runSelectQuery(roomId)
  return roomFound

  async function runSelectQuery(roomId) {
    const results = await database.query({
      text: `
        SELECT 
          r.*,
          r.member_price_per_night,
          h.name as hotel_name,
          h.check_in_date as hotel_check_in_date,
          h.check_out_date as hotel_check_out_date,
          rt.name as room_type,
          rc.name as room_category,
          rc.max_adults,
          rc.max_children,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', pp.id,
                  'max_age', pp.max_age,
                  'description', pp.description,
                  'use_percentage', pp.use_percentage,
                  'percentage', pp.percentage,
                  'price', rpp.price
                ) ORDER BY pp.max_age ASC
              )
              FROM "price_policies" pp
              LEFT JOIN "room_price_policies" rpp ON pp.id = rpp.price_policy_id AND rpp.room_id = r.id
              WHERE pp.hotel_id = r.hotel_id
            ),
            '[]'::json
          ) as price_policies
        FROM
          "rooms" r
        JOIN
          "hotels" h ON r.hotel_id = h.id
        JOIN
          "room-types" rt ON r.room_type_id = rt.id
        JOIN
          "room-categories" rc ON r.room_category_id = rc.id
        WHERE
          r.id = $1
        LIMIT
          1
        ;`,
      values: [roomId],
    })

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O ID do quarto informado não foi encontrado no sistema.",
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
        id,
        hotel_id,
        room_type_id,
        room_category_id,
        price_per_night,
        member_price_per_night,
        total_rooms,
        available_rooms,
        blocked_rooms,
        name,
        description,
        photos,
        created_at,
        updated_at
      FROM 
        "rooms"
      ORDER BY 
        created_at DESC
    `,
  })

  return results.rows
}

async function findAllByHotelId(hotelId) {
  validateUUID(hotelId)

  const results = await database.query({
    text: `
      SELECT 
        r.id,
        r.hotel_id,
        rt.name as room_type,
        rc.name as room_category,
        r.room_type_id,
        r.room_category_id,
        r.price_per_night,
        r.member_price_per_night,
        r.total_rooms,
        r.available_rooms,
        r.blocked_rooms,
        r.name,
        r.description,
        r.photos,
        rc.max_adults,
        rc.max_children,
        h.check_in_date as hotel_check_in_date,
        r.created_at,
        r.updated_at,
        COALESCE(
          (
            SELECT json_agg(json_build_object(
              'id', pp.id,
              'max_age', pp.max_age,
              'description', pp.description,
              'use_percentage', pp.use_percentage,
              'percentage', pp.percentage,
              'price', rpp.price
            ) ORDER BY pp.max_age ASC)
            FROM "price_policies" pp
            LEFT JOIN "room_price_policies" rpp ON rpp.price_policy_id = pp.id AND rpp.room_id = r.id
            WHERE pp.hotel_id = r.hotel_id
          ),
          '[]'::json
        ) as price_policies
      FROM 
        "rooms" r
      JOIN "hotels" h ON r.hotel_id = h.id
      JOIN "room-types" rt ON r.room_type_id = rt.id
      JOIN "room-categories" rc ON r.room_category_id = rc.id
      WHERE 
        r.hotel_id = $1
      ORDER BY 
        r.created_at DESC
    `,
    values: [hotelId],
  })

  return results.rows
}

async function update(roomId, roomInputNewValues, userId) {
  validateUUID(roomId)
  validateUUID(userId)

  if (Object.keys(roomInputNewValues).length === 0) {
    throw new ValidationError({
      message: `Nenhum campo enviado para atualização.`,
      action: "Envie algum campo e tente novamente.",
    })
  }

  const currentRoom = await findOneById(roomId)

  if ("hotel_id" in roomInputNewValues) {
    validateUUID(roomInputNewValues.hotel_id)
    await verifyHotelBelongsToUser(roomInputNewValues.hotel_id, userId)
  }

  if ("room_type_id" in roomInputNewValues) {
    validateUUID(roomInputNewValues.room_type_id)
    await verifyRoomTypeBelongsToUser(roomInputNewValues.room_type_id, userId)
  }

  if ("room_category_id" in roomInputNewValues) {
    validateUUID(roomInputNewValues.room_category_id)
    await verifyRoomCategoryBelongsToUser(
      roomInputNewValues.room_category_id,
      userId,
    )
  }

  let normalizedRoomWithNewValues

  if (
    "total_rooms" in roomInputNewValues ||
    "available_rooms" in roomInputNewValues ||
    "blocked_rooms" in roomInputNewValues
  ) {
    normalizedRoomWithNewValues = await validateAndNormalizeRoomAvailability(
      currentRoom,
      roomInputNewValues,
    )
  }

  const roomWithNewValues = {
    ...currentRoom,
    ...roomInputNewValues,
    ...normalizedRoomWithNewValues,
  }

  const updatedRoom = await runUpdateQuery(roomWithNewValues)

  if (
    roomInputNewValues.price_policies &&
    Array.isArray(roomInputNewValues.price_policies)
  ) {
    await syncRoomPricePolicies(updatedRoom.id, roomInputNewValues.price_policies)
  }

  return await findOneById(updatedRoom.id)

  async function runUpdateQuery(roomWithNewValues) {
    const {
      id,
      hotel_id,
      room_type_id,
      room_category_id,
      price_per_night,
      member_price_per_night,
      total_rooms,
      available_rooms,
      blocked_rooms,
    } = roomWithNewValues

    const results = await database.query({
      text: `
        UPDATE
          "rooms"
        SET 
          hotel_id = $2,
          room_type_id = $3,
          room_category_id = $4,
          price_per_night = $5,
          member_price_per_night = $6,
          total_rooms = $7,
          available_rooms = $8,
          blocked_rooms = $9,
          name = $10,
          description = $11,
          photos = $12,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
      `,
      values: [
        id,
        hotel_id,
        room_type_id,
        room_category_id,
        price_per_night,
        member_price_per_night,
        total_rooms,
        available_rooms,
        blocked_rooms,
        roomWithNewValues.name,
        roomWithNewValues.description,
        roomWithNewValues.photos || [],
      ],
    })

    return results.rows[0]
  }

  async function validateAndNormalizeRoomAvailability(currentRoom, newValues) {
    const roomId = currentRoom.id
    const currentTotal = currentRoom.total_rooms
    const currentBlocked = currentRoom.blocked_rooms

    let total = newValues.total_rooms ?? currentTotal
    let blocked = newValues.blocked_rooms ?? currentBlocked

    // Calculate sold rooms from "sales" table (Source of Truth)
    const salesResults = await database.query({
      text: `
        SELECT count(*)::int as sold_rooms
        FROM "sales"
        WHERE room_id = $1 AND status != 'cancelled'
      `,
      values: [roomId],
    })

    const soldRooms = salesResults.rows[0].sold_rooms

    let available = total - blocked - soldRooms

    if (total < 0 || blocked < 0) {
      throw new ValidationError({
        message: "Os valores de quartos não podem ser negativos.",
        action: "Verifique os campos e tente novamente.",
      })
    }

    if (available < 0) {
      throw new ValidationError({
        message:
          "O novo total/bloqueio de quartos é insuficiente para as vendas já realizadas.",
        action: "Aumente o total de quartos ou diminua os bloqueados.",
      })
    }

    if (
      "available_rooms" in newValues &&
      newValues.available_rooms !== available
    ) {
      throw new ValidationError({
        message:
          "O valor de quartos disponíveis informado diverge do calculado pelo sistema.",
        action:
          "Permita que o sistema calcule a disponibilidade automaticamente.",
      })
    }

    return {
      ...newValues,
      available_rooms: available,
      blocked_rooms: blocked,
      total_rooms: total,
    }
  }
}

async function deleteById(roomId, userId) {
  validateUUID(roomId)
  validateUUID(userId)

  await database.query({
    text: `
    DELETE FROM "rooms"
    WHERE id = $1
    `,
    values: [roomId],
  })
}

async function verifyHotelBelongsToUser(hotelId, userId) {
  const results = await database.query({
    text: `
      SELECT id FROM hotels
      WHERE id = $1
      LIMIT 1
    `,
    values: [hotelId],
  })

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "Hotel não encontrado ou não pertence ao usuário.",
      action: "Verifique se o hotel existe e pertence a você.",
    })
  }
}

async function verifyRoomTypeBelongsToUser(roomTypeId, userId) {
  const results = await database.query({
    text: `
      SELECT id FROM "room-types"
      WHERE id = $1
      LIMIT 1
    `,
    values: [roomTypeId],
  })

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "Tipo de quarto não encontrado ou não pertence ao usuário.",
      action: "Verifique se o tipo de quarto existe e pertence a você.",
    })
  }
}

async function verifyRoomCategoryBelongsToUser(roomCategoryId, userId) {
  const results = await database.query({
    text: `
      SELECT id FROM "room-categories"
      WHERE id = $1
      LIMIT 1
    `,
    values: [roomCategoryId],
  })

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "Categoria de quarto não encontrada ou não pertence ao usuário.",
      action: "Verifique se a categoria de quarto existe e pertence a você.",
    })
  }
}

async function syncRoomPricePolicies(roomId, pricePolicies) {
  // 1. Delete existing specific prices for this room
  await database.query({
    text: `DELETE FROM "room_price_policies" WHERE room_id = $1`,
    values: [roomId],
  })

  // 2. Insert new ones
  for (const policy of pricePolicies) {
    if (!policy.id || policy.price === undefined || policy.price === "") {
      continue
    }

    await database.query({
      text: `
        INSERT INTO "room_price_policies" (room_id, price_policy_id, price)
        VALUES ($1, $2, $3)
      `,
      values: [roomId, policy.id, policy.price],
    })
  }
}

const room = {
  create,
  findOneById,
  findAll,
  findAllByHotelId,
  update,
  deleteById,
  syncRoomPricePolicies,
}

export default room
