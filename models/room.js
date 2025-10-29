import database from "infra/database.js"
import { ValidationError, NotFoundError } from "infra/errors.js"
import { validateRequiredFields, validateUUID } from "infra/validator.js"

async function create(roomInputValues, userId) {
  validateRequiredFields(roomInputValues, [
    "hotel_id",
    "room_type_id",
    "room_category_id",
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
  return newRoom

  async function runInsertQuery(roomInputValues, userId) {
    const {
      hotel_id,
      room_type_id,
      room_category_id,
      price_per_night = 0,
      total_rooms = 0,
      available_rooms = 0,
      blocked_rooms = 0,
    } = roomInputValues

    const results = await database.query({
      text: `
        INSERT INTO
          "rooms" (user_id, hotel_id, room_type_id, room_category_id, price_per_night, total_rooms, available_rooms, blocked_rooms)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING
          *
      `,
      values: [
        userId,
        hotel_id,
        room_type_id,
        room_category_id,
        price_per_night,
        total_rooms,
        available_rooms,
        blocked_rooms,
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
          * 
        FROM 
          "rooms"
        WHERE 
          id = $1
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

async function findOneByIdAndUserId(roomId, userId) {
  validateUUID(roomId)
  validateUUID(userId)

  const results = await database.query({
    text: `
      SELECT 
        * 
      FROM 
        "rooms"
      WHERE 
        id = $1 AND user_id = $2
      LIMIT
        1
      ;`,
    values: [roomId, userId],
  })

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "O ID do quarto informado não foi encontrado no sistema.",
      action: "Verifique se o ID está digitado corretamente.",
    })
  }

  return results.rows[0]
}

async function findAllByUserId(userId) {
  validateUUID(userId)

  const results = await database.query({
    text: `
      SELECT 
        id,
        hotel_id,
        room_type_id,
        room_category_id,
        price_per_night,
        total_rooms,
        available_rooms,
        blocked_rooms,
        created_at,
        updated_at
      FROM 
        "rooms"
      WHERE 
        user_id = $1
      ORDER BY 
        created_at DESC
    `,
    values: [userId],
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

  // Verificar se os IDs relacionados pertencem ao usuário (apenas se estiverem sendo alterados)
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

  // Verifica se ao menos um dos campos de quartos está presente para atualização
  if (
    "total_rooms" in roomInputNewValues ||
    "available_rooms" in roomInputNewValues ||
    "blocked_rooms" in roomInputNewValues
  ) {
    normalizedRoomWithNewValues = validateAndNormalizeRoomAvailability(
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
  return updatedRoom

  async function runUpdateQuery(roomWithNewValues) {
    const {
      id,
      hotel_id,
      room_type_id,
      room_category_id,
      price_per_night,
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
          total_rooms = $6,
          available_rooms = $7,
          blocked_rooms = $8,
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
        total_rooms,
        available_rooms,
        blocked_rooms,
      ],
    })

    return results.rows[0]
  }

  function validateAndNormalizeRoomAvailability(currentRoom, newValues) {
    // Valores atuais
    const currentAvailable = currentRoom.available_rooms
    const currentBlocked = currentRoom.blocked_rooms
    const currentTotal = currentRoom.total_rooms

    // Valores novos (ou mantidos)
    let available = newValues.available_rooms ?? currentAvailable
    let blocked = newValues.blocked_rooms ?? currentBlocked
    let total = newValues.total_rooms ?? currentTotal

    // Regra 3️⃣ — Se o usuário informou apenas o total,
    // recalcular 'available_rooms' mantendo o valor de 'blocked_rooms'
    if (
      "total_rooms" in newValues &&
      !("available_rooms" in newValues) &&
      !("blocked_rooms" in newValues)
    ) {
      console.log("oi")
      const calculatedAvailable = total - blocked

      // Se o disponível calculado for negativo, forçamos ele a ser 0,
      // e deixamos a Regra 2 (soma) lidar com a inconsistência.
      available = Math.max(0, calculatedAvailable)
      console.log(available)
    }

    // Regra 1️⃣ — Nenhum valor pode ser negativo
    if (available < 0 || blocked < 0 || total < 0) {
      throw new ValidationError({
        message: "Os valores de quartos não podem ser negativos.",
        action: "Verifique os campos e tente novamente.",
      })
    }

    // Regra 2️⃣ — Soma deve ser exatamente igual ao total
    if (available + blocked !== total) {
      throw new ValidationError({
        message:
          "A soma de quartos disponíveis e bloqueados deve ser igual ao total.",
        action: "Ajuste os valores e tente novamente.",
      })
    }

    // Retorna os valores ajustados
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
    WHERE user_id = $1 and id = $2
    `,
    values: [userId, roomId],
  })
}

async function verifyHotelBelongsToUser(hotelId, userId) {
  const results = await database.query({
    text: `
      SELECT id FROM hotels
      WHERE id = $1 AND user_id = $2
      LIMIT 1
    `,
    values: [hotelId, userId],
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
      WHERE id = $1 AND user_id = $2
      LIMIT 1
    `,
    values: [roomTypeId, userId],
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
      WHERE id = $1 AND user_id = $2
      LIMIT 1
    `,
    values: [roomCategoryId, userId],
  })

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "Categoria de quarto não encontrada ou não pertence ao usuário.",
      action: "Verifique se a categoria de quarto existe e pertence a você.",
    })
  }
}

const room = {
  create,
  findOneById,
  findOneByIdAndUserId,
  findAllByUserId,
  update,
  deleteById,
}

export default room
