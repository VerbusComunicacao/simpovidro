import database from "infra/database.js"
import { ValidationError, NotFoundError } from "infra/errors.js"
import { validateRequiredFields, validateUUID } from "infra/validator.js"

async function create(roomInputValues, userId) {
  if (roomInputValues.parent_room_id) {
    validateUUID(roomInputValues.parent_room_id)
    const parent = await findOneById(roomInputValues.parent_room_id)
    if (parent.parent_room_id) {
      throw new ValidationError({
        message:
          "Não é possível aninhar quartos. O quarto pai selecionado já é um quarto filho.",
        action: "Selecione um quarto que não seja filho de outro.",
      })
    }
    roomInputValues.hotel_id = parent.hotel_id
    roomInputValues.room_type_id = parent.room_type_id
    roomInputValues.name = parent.name
    roomInputValues.description = parent.description
    roomInputValues.photos = parent.photos
    roomInputValues.total_rooms = parent.total_rooms
    roomInputValues.blocked_rooms = parent.blocked_rooms
    roomInputValues.available_rooms = parent.available_rooms
  }

  validateRequiredFields(roomInputValues, [
    "hotel_id",
    "room_type_id",
    "room_category_id",
    "price_per_night",
    "total_rooms",
    "name",
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
      min_guests = 1,
      parent_room_id = null,
    } = roomInputValues

    const results = await database.query({
      text: `
        INSERT INTO
          "rooms" (user_id, hotel_id, room_type_id, room_category_id, price_per_night, member_price_per_night, total_rooms, available_rooms, blocked_rooms, name, description, photos, min_guests, parent_room_id)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
        min_guests,
        parent_room_id,
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
          h.checkout_question as hotel_checkout_question,
          rt.name as room_type,
          rt.description as room_type_description,
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
        LEFT JOIN
          "room-types" rt ON r.room_type_id = rt.id
        LEFT JOIN
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
        parent_room_id,
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
        min_guests,
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
        r.parent_room_id,
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
        r.min_guests,
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
      LEFT JOIN "room-types" rt ON r.room_type_id = rt.id
      LEFT JOIN "room-categories" rc ON r.room_category_id = rc.id
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

  // Resolve and validate parent_room_id
  const parentRoomId =
    "parent_room_id" in roomInputNewValues
      ? roomInputNewValues.parent_room_id
      : currentRoom.parent_room_id
  if (parentRoomId) {
    if (
      "total_rooms" in roomInputNewValues ||
      "blocked_rooms" in roomInputNewValues
    ) {
      throw new ValidationError({
        message:
          "Este quarto é um quarto filho e herda a disponibilidade do quarto pai. Altere a disponibilidade no quarto pai.",
        action: "Edite o quarto pai correspondente.",
      })
    }

    validateUUID(parentRoomId)
    const parent = await findOneById(parentRoomId)
    if (parent.parent_room_id) {
      throw new ValidationError({
        message:
          "Não é possível aninhar quartos. O quarto pai selecionado já é um quarto filho.",
        action: "Selecione um quarto que não seja filho de outro.",
      })
    }

    // Force inherited values from parent
    roomInputNewValues.hotel_id = parent.hotel_id
    roomInputNewValues.room_type_id = parent.room_type_id
    roomInputNewValues.name = parent.name
    roomInputNewValues.description = parent.description
    roomInputNewValues.photos = parent.photos
    roomInputNewValues.total_rooms = parent.total_rooms
    roomInputNewValues.blocked_rooms = parent.blocked_rooms
    roomInputNewValues.available_rooms = parent.available_rooms
  }

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

  // Propagate updates to children if this is a parent room
  if (!updatedRoom.parent_room_id) {
    await database.query({
      text: `
        UPDATE "rooms"
        SET 
          hotel_id = $2,
          room_type_id = $3,
          name = $4,
          description = $5,
          photos = $6,
          total_rooms = $7,
          blocked_rooms = $8,
          available_rooms = $9,
          updated_at = timezone('utc', now())
        WHERE
          parent_room_id = $1
      `,
      values: [
        roomId,
        updatedRoom.hotel_id,
        updatedRoom.room_type_id,
        updatedRoom.name,
        updatedRoom.description,
        updatedRoom.photos || [],
        updatedRoom.total_rooms,
        updatedRoom.blocked_rooms,
        updatedRoom.available_rooms,
      ],
    })
  }

  if (
    roomInputNewValues.price_policies &&
    Array.isArray(roomInputNewValues.price_policies)
  ) {
    await syncRoomPricePolicies(
      updatedRoom.id,
      roomInputNewValues.price_policies,
    )
  }

  // Recalculate old parent availability if relationship changed
  if (
    currentRoom.parent_room_id &&
    currentRoom.parent_room_id !== updatedRoom.parent_room_id
  ) {
    const oldParentId = currentRoom.parent_room_id
    const oldParent = await findOneById(oldParentId)
    const salesResults = await database.query({
      text: `
        SELECT count(*)::int as sold_rooms
        FROM "sales"
        WHERE (room_id = $1 OR room_id IN (SELECT id FROM "rooms" WHERE parent_room_id = $1))
          AND status != 'cancelled'
      `,
      values: [oldParentId],
    })
    const soldRooms = salesResults.rows[0].sold_rooms
    const newAvailable =
      oldParent.total_rooms - oldParent.blocked_rooms - soldRooms

    // Update old parent
    await database.query({
      text: `
        UPDATE "rooms"
        SET available_rooms = $2, updated_at = timezone('utc', now())
        WHERE id = $1
      `,
      values: [oldParentId, newAvailable],
    })

    // Sync other children of the old parent
    await database.query({
      text: `
        UPDATE "rooms"
        SET available_rooms = $2, updated_at = timezone('utc', now())
        WHERE parent_room_id = $1
      `,
      values: [oldParentId, newAvailable],
    })
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
      min_guests,
      parent_room_id = null,
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
          min_guests = $13,
          parent_room_id = $14,
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
        min_guests,
        parent_room_id,
      ],
    })

    return results.rows[0]
  }

  async function validateAndNormalizeRoomAvailability(currentRoom, newValues) {
    const parentRoomId =
      "parent_room_id" in newValues
        ? newValues.parent_room_id
        : currentRoom.parent_room_id

    if (parentRoomId) {
      // It is a child room, so its inventory is bound to the parent's inventory.
      const parent = await findOneById(parentRoomId)

      // Calculate sales under this parent (including all its children and the current room being updated)
      const salesResults = await database.query({
        text: `
          SELECT count(*)::int as sold_rooms
          FROM "sales"
          WHERE (
            room_id = $1 
            OR room_id IN (SELECT id FROM "rooms" WHERE parent_room_id = $1)
            OR room_id = $2
          )
          AND status != 'cancelled'
        `,
        values: [parentRoomId, currentRoom.id],
      })

      const soldRooms = salesResults.rows[0].sold_rooms
      const available = parent.total_rooms - parent.blocked_rooms - soldRooms

      if (available < 0) {
        throw new ValidationError({
          message:
            "O total de quartos do pai é insuficiente para as vendas do pai e de todos os filhos.",
          action: "Aumente o total de quartos no quarto pai.",
        })
      }

      // If the parent's current available count differs from what we just calculated, update the parent's record
      if (parent.available_rooms !== available) {
        await database.query({
          text: `
            UPDATE "rooms" 
            SET available_rooms = $2, updated_at = timezone('utc', now())
            WHERE id = $1
          `,
          values: [parentRoomId, available],
        })

        // Also propagate this to all other sibling child rooms to keep them in sync
        await database.query({
          text: `
            UPDATE "rooms"
            SET available_rooms = $2, updated_at = timezone('utc', now())
            WHERE parent_room_id = $1 AND id != $3
          `,
          values: [parentRoomId, available, currentRoom.id],
        })
      }

      return {
        ...newValues,
        total_rooms: parent.total_rooms,
        blocked_rooms: parent.blocked_rooms,
        available_rooms: available,
      }
    }

    const roomId = currentRoom.id
    const currentTotal = currentRoom.total_rooms
    const currentBlocked = currentRoom.blocked_rooms

    let total = newValues.total_rooms ?? currentTotal
    let blocked = newValues.blocked_rooms ?? currentBlocked

    // Calculate sold rooms from "sales" table (Source of Truth)
    // We sum sales of this room and sales of any children sharing this room's inventory
    const salesResults = await database.query({
      text: `
        SELECT count(*)::int as sold_rooms
        FROM "sales"
        WHERE (room_id = $1 OR room_id IN (SELECT id FROM "rooms" WHERE parent_room_id = $1))
          AND status != 'cancelled'
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

  try {
    await database.query({
      text: `
      DELETE FROM "rooms"
      WHERE id = $1
      `,
      values: [roomId],
    })
  } catch (error) {
    if (error.code === "23503") {
      throw new ValidationError({
        message:
          "Este quarto não pode ser excluído pois existem inscrições ou outros registros vinculados a ele.",
        action:
          "Cancele as inscrições vinculadas a este quarto antes de tentar novamente.",
      })
    }
    throw error
  }
}

async function verifyHotelBelongsToUser(hotelId) {
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

async function verifyRoomTypeBelongsToUser(roomTypeId) {
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

async function verifyRoomCategoryBelongsToUser(roomCategoryId) {
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
