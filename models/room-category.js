import database from "infra/database.js"
import { ConflictError, ValidationError, NotFoundError } from "infra/errors.js"
import { validateRequiredFields, validateUUID } from "infra/validator.js"

async function create(roomCategoryInputValues, userId) {
  validateRequiredFields(roomCategoryInputValues, ["name"])
  await verifyRoomCategoryAlreadyExists(roomCategoryInputValues.name, userId)

  const newRoomCategory = await runInsertQuery(roomCategoryInputValues, userId)
  return newRoomCategory

  async function runInsertQuery(roomCategoryInputValues, userId) {
    const { name, max_adults = 1, max_children = 0 } = roomCategoryInputValues

    const results = await database.query({
      text: `
        INSERT INTO
          "room-categories" (user_id, name, max_adults, max_children)
        VALUES
          ($1, $2, $3, $4)
        RETURNING
          *
      `,
      values: [userId, name, max_adults, max_children],
    })

    return results.rows[0]
  }
}

async function findOneById(roomCategoryId) {
  validateUUID(roomCategoryId)
  const roomCategoryFound = await runSelectQuery(roomCategoryId)
  return roomCategoryFound

  async function runSelectQuery(roomCategoryId) {
    const results = await database.query({
      text: `
        SELECT 
          * 
        FROM 
          "room-categories"
        WHERE 
          id = $1
        LIMIT
          1
        ;`,
      values: [roomCategoryId],
    })

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message:
          "O ID da categoria de quarto informado não foi encontrado no sistema.",
        action: "Verifique se o ID está digitado corretamente.",
      })
    }

    return results.rows[0]
  }
}

async function findOneByIdAndUserId(roomCategoryId, userId) {
  validateUUID(roomCategoryId)
  validateUUID(userId)

  const results = await database.query({
    text: `
      SELECT 
        * 
      FROM 
        "room-categories"
      WHERE 
        id = $1 AND user_id = $2
      LIMIT
        1
      ;`,
    values: [roomCategoryId, userId],
  })

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message:
        "O ID da categoria de quarto informado não foi encontrado no sistema.",
      action: "Verifique se o ID está digitado corretamente.",
    })
  }

  return results.rows[0]
}

async function findAllByUserId(userId) {
  const results = await database.query({
    text: `
      SELECT 
        id,
        name,
        max_adults,
        max_children,
        created_at,
        updated_at
      FROM 
        "room-categories"
      WHERE 
        user_id = $1
      ORDER BY 
        created_at DESC
    `,
    values: [userId],
  })

  return results.rows
}

async function update(roomCategoryId, roomCategoryInputNewValues, userId) {
  if (Object.keys(roomCategoryInputNewValues).length === 0) {
    throw new ValidationError({
      message: `Nenhum campo enviado para atualização.`,
      action: "Envie algum campo e tente novamente.",
    })
  }

  const currentRoomCategory = await findOneById(roomCategoryId)

  // Verificar se o nome já existe (apenas se o nome estiver sendo alterado)
  if (
    "name" in roomCategoryInputNewValues &&
    roomCategoryInputNewValues.name !== currentRoomCategory.name
  ) {
    await verifyRoomCategoryAlreadyExists(
      roomCategoryInputNewValues.name,
      userId,
    )
  }

  const roomCategoryWithNewValues = {
    ...currentRoomCategory,
    ...roomCategoryInputNewValues,
  }

  const updatedRoomCategory = await runUpdateQuery(roomCategoryWithNewValues)
  return updatedRoomCategory

  async function runUpdateQuery(roomCategoryWithNewValues) {
    const { id, name, max_adults, max_children } = roomCategoryWithNewValues

    const results = await database.query({
      text: `
        UPDATE
          "room-categories"
        SET 
          name = $2,
          max_adults = $3,
          max_children = $4,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
      `,
      values: [id, name, max_adults, max_children],
    })

    return results.rows[0]
  }
}

async function deleteById(roomCategoryId, userId) {
  await database.query({
    text: `
    DELETE FROM "room-categories"
    WHERE user_id = $1 and id = $2
    `,
    values: [userId, roomCategoryId],
  })
}

async function verifyRoomCategoryAlreadyExists(name, userId) {
  const results = await database.query({
    text: `
      SELECT *
      FROM "room-categories"
      WHERE user_id = $1
        AND name = $2
      LIMIT 1
    `,
    values: [userId, name],
  })

  if (results.rowCount > 0) {
    throw new ConflictError({
      message:
        "Já existe uma categoria de quarto cadastrada com esse nome para este usuário.",
      action: "Escolha outro nome ou edite a categoria de quarto existente.",
    })
  }
}

const roomCategory = {
  create,
  findOneById,
  findOneByIdAndUserId,
  findAllByUserId,
  update,
  deleteById,
}

export default roomCategory
