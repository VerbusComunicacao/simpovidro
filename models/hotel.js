import database from "infra/database.js"
import { ConflictError, ValidationError, NotFoundError } from "infra/errors.js"
import {
  validateRequiredFields as validateRequired,
  validateUUID,
} from "infra/validator.js"

async function create(hotelInputValues, userId) {
  validateRequired(hotelInputValues, ["name", "city", "country", "check_in_date", "check_out_date"])
  await verifyIHotelAlreadyExists(hotelInputValues.name, userId)

  const newHotel = await runInsertQuery(hotelInputValues, userId)

  if (hotelInputValues.price_policies && Array.isArray(hotelInputValues.price_policies)) {
    await syncPricePolicies(newHotel.id, hotelInputValues.price_policies)
  }

  return await findOneById(newHotel.id)

  async function runInsertQuery(hotelInputValues, userId) {
    const {
      name,
      email = null,
      phone = null,
      address = null,
      city,
      state = null,
      country = null,
      check_in_date = null,
      check_out_date = null,
    } = hotelInputValues

    const results = await database.query({
      text: `
        INSERT INTO
          hotels (user_id, name, email, phone, address, city, state, country, active, check_in_date, check_out_date)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING
          *
      `,
      values: [userId, name, email, phone, address, city, state, country, false, check_in_date, check_out_date],
    })

    return results.rows[0]
  }
}

async function findOneById(hotelId) {
  validateUUID(hotelId)
  const hotelFound = await runSelectQuery(hotelId)
  return hotelFound

  async function runSelectQuery(hotelId) {
    const results = await database.query({
      text: `
        SELECT 
          h.*,
          COALESCE(
            (
              SELECT json_agg(pp.* ORDER BY pp.max_age ASC)
              FROM "price_policies" pp
              WHERE pp.hotel_id = h.id
            ),
            '[]'::json
          ) as price_policies
        FROM 
          hotels h
        WHERE 
          h.id = $1
        LIMIT
          1
        ;`,
      values: [hotelId],
    })

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O ID do hotel informado não foi encontrado no sistema.",
        action: "Verifique se o ID está digitado corretamente.",
      })
    }

    return results.rows[0]
  }
}

async function findOneByIdAndUserId(hotelId, userId) {
  validateUUID(hotelId)

  const results = await database.query({
    text: `
      SELECT 
        h.*,
        COALESCE(
          (
            SELECT json_agg(pp.* ORDER BY pp.max_age ASC)
            FROM "price_policies" pp
            WHERE pp.hotel_id = h.id
          ),
          '[]'::json
        ) as price_policies
      FROM 
        hotels h
      WHERE 
        h.id = $1 AND h.user_id = $2
      LIMIT
        1
      ;`,
    values: [hotelId, userId],
  })

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "O ID do hotel informado não foi encontrado no sistema.",
      action: "Verifique se o ID está digitado corretamente.",
    })
  }

  return results.rows[0]
}

async function update(hotelId, hotelInputNewValues, userId) {
  if (Object.keys(hotelInputNewValues).length === 0) {
    throw new ValidationError({
      message: `Nenhum campo enviado para atualização.`,
      action: "Envie algum campo e tente novamente.",
    })
  }

  const currentHotel = await findOneById(hotelId)

  // Validar campos apenas se fornecidos
  const fieldsToValidate = ["name", "city", "country", "check_in_date", "check_out_date"].filter(
    (field) => field in hotelInputNewValues,
  )
  if (fieldsToValidate.length > 0) {
    validateRequired(hotelInputNewValues, fieldsToValidate)
  }

  // Verificar se o nome já existe (apenas se o nome estiver sendo alterado)
  if (
    "name" in hotelInputNewValues &&
    hotelInputNewValues.name !== currentHotel.name
  ) {
    await verifyIHotelAlreadyExists(hotelInputNewValues.name, userId)
  }

  const hotelWithNewValues = { ...currentHotel, ...hotelInputNewValues }

  const updatedHotel = await runUpdateQuery(hotelWithNewValues)

  if (hotelInputNewValues.price_policies && Array.isArray(hotelInputNewValues.price_policies)) {
    await syncPricePolicies(updatedHotel.id, hotelInputNewValues.price_policies)
  }

  return await findOneById(updatedHotel.id)

  async function runUpdateQuery(hotelWithNewValues) {
    const { id, name, email, phone, address, city, state, country, active, check_in_date, check_out_date } =
      hotelWithNewValues

    const client = await database.getNewClient()
    try {
      await client.query("BEGIN")

      if (active === true) {
        // Desativa todos os outros hotéis
        await client.query("UPDATE hotels SET active = false")
      }

      const results = await client.query({
        text: `
          UPDATE
            hotels
          SET 
            name = $2,
            email = $3,
            phone = $4,
            address = $5,
            city = $6,
            state = $7,
            country = $8,
            active = $9,
            check_in_date = $10,
            check_out_date = $11,
            updated_at = timezone('utc', now())
          WHERE
            id = $1
          RETURNING
            *
        `,
        values: [id, name, email, phone, address, city, state, country, active, check_in_date, check_out_date],
      })

      await client.query("COMMIT")
      return results.rows[0]
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      await client.end()
    }
  }
}

async function deleteById(hotelId, userId) {
  validateUUID(hotelId)
  validateUUID(userId)

  await database.query({
    text: `
    DELETE FROM hotels
    WHERE user_id = $1 and id = $2
    `,
    values: [userId, hotelId],
  })
}

async function findAllByUserId(userId) {
  const results = await database.query({
    text: `
      SELECT 
        h.*,
        COALESCE(
          (
            SELECT json_agg(pp.* ORDER BY pp.max_age ASC)
            FROM "price_policies" pp
            WHERE pp.hotel_id = h.id
          ),
          '[]'::json
        ) as price_policies
      FROM 
        hotels h
      WHERE 
        h.user_id = $1
      ORDER BY 
        h.created_at DESC
    `,
    values: [userId],
  })

  return results.rows
}

async function verifyIHotelAlreadyExists(name, userId) {
  const results = await database.query({
    text: `
      SELECT *
      FROM hotels
      WHERE user_id = $1
        AND name = $2
      LIMIT 1
    `,
    values: [userId, name],
  })

  if (results.rowCount > 0) {
    throw new ConflictError({
      message: "Já existe um hotel cadastrado com esse nome para este usuário.",
      action: "Escolha outro nome ou edite o hotel existente.",
    })
  }
}

async function activate(hotelId) {
  validateUUID(hotelId)

  const client = await database.getNewClient()
  try {
    await client.query("BEGIN")

    // 1. Desativa todos os hotéis
    await client.query("UPDATE hotels SET active = false")

    // 2. Ativa o hotel alvo
    const results = await client.query({
      text: "UPDATE hotels SET active = true, updated_at = timezone('utc', now()) WHERE id = $1 RETURNING *",
      values: [hotelId],
    })

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O ID do hotel informado não foi encontrado no sistema.",
        action: "Verifique se o ID está digitado corretamente.",
      })
    }

    await client.query("COMMIT")
    return results.rows[0]
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    await client.end()
  }
}

async function getAllActiveHotels() {
  const results = await database.query({
    text: `
      SELECT 
        h.id,
        h.name,
        h.city,
        h.country,
        h.email,
        h.check_in_date,
        h.check_out_date,
        h.active,
        COALESCE(
          (
            SELECT json_agg(pp.* ORDER BY pp.max_age ASC)
            FROM "price_policies" pp
            WHERE pp.hotel_id = h.id
          ),
          '[]'::json
        ) as price_policies,
        COALESCE(
          json_agg(
            json_build_object(
              'id', r.id,
              'price_per_night', r.price_per_night,
              'available_rooms', r.available_rooms,
              'room_type', rt.name,
              'room_type_description', rt.description,
              'room_category', rc.name,
              'max_adults', rc.max_adults,
              'max_children', rc.max_children,
              'name', r.name,
              'description', r.description,
              'photos', r.photos
            )
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'
        ) as rooms
      FROM 
        hotels h
      LEFT JOIN rooms r ON h.id = r.hotel_id
      LEFT JOIN "room-types" rt ON r.room_type_id = rt.id
      LEFT JOIN "room-categories" rc ON r.room_category_id = rc.id
      WHERE 
        h.active = true
      GROUP BY 
        h.id
    `,
  })

  return results.rows
}

async function syncPricePolicies(hotelId, policies) {
    // 1. Delete existing
    await database.query({
        text: `DELETE FROM "price_policies" WHERE hotel_id = $1`,
        values: [hotelId]
    })

    // 2. Insert new
    for (const policy of policies) {
        if (
            policy.max_age === undefined || policy.max_age === "" || 
            policy.percentage === undefined || policy.percentage === "" || 
            !policy.description
        ) continue;
        
        await database.query({
            text: `
                INSERT INTO "price_policies" (hotel_id, max_age, percentage, description)
                VALUES ($1, $2, $3, $4)
            `,
            values: [hotelId, policy.max_age, policy.percentage, policy.description]
        })
    }
}

const hotel = {
  create,
  findOneById,
  findOneByIdAndUserId,
  findAllByUserId,
  update,
  deleteById,
  activate,
  getAllActiveHotels,
}
export default hotel
