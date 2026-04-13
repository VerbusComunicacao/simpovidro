import database from "infra/database.js"
import { ConflictError, ValidationError, NotFoundError } from "infra/errors.js"
import {
  validateRequiredFields as validateRequired,
  validateUUID,
} from "infra/validator.js"

async function create(roomTypeInputValues, userId) {
  validateRequired(roomTypeInputValues, ["name"])
  await verifyRoomTypeAlreadyExists(roomTypeInputValues.name)

  const newRoomType = await runInsertQuery(roomTypeInputValues, userId)
  return newRoomType

  async function runInsertQuery(roomTypeInputValues, userId) {
    const { name, description = null } = roomTypeInputValues

    const results = await database.query({
      text: `
        INSERT INTO
          "room-types" (user_id, name, description)
        VALUES
          ($1, $2, $3)
        RETURNING
          *
      `,
      values: [userId, name, description],
    })

    return results.rows[0]
  }
}

async function findOneById(roomTypeId) {
  validateUUID(roomTypeId)
  const roomTypeFound = await runSelectQuery(roomTypeId)
  return roomTypeFound

  async function runSelectQuery(roomTypeId) {
    const results = await database.query({
      text: `
        SELECT 
          * 
        FROM 
          "room-types"
        WHERE 
          id = $1
        LIMIT
          1
        ;`,
      values: [roomTypeId],
    })

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message:
          "O ID do tipo de quarto informado não foi encontrado no sistema.",
        action: "Verifique se o ID está digitado corretamente.",
      })
    }

    return results.rows[0]
  }
}

async function findAll() {
  const results = await database.query({
    text: `
      SELECT * FROM "room-types"
      ORDER BY created_at DESC
    `,
  })

  return results.rows
}

async function update(roomTypeId, roomTypeInputNewValues, userId) {
  if (Object.keys(roomTypeInputNewValues).length === 0) {
    throw new ValidationError({
      message: `Nenhum campo enviado para atualização.`,
      action: "Envie algum campo e tente novamente.",
    })
  }

  const currentRoomType = await findOneById(roomTypeId)

  // Verificar se o nome já existe (apenas se o nome estiver sendo alterado)
  if (
    "name" in roomTypeInputNewValues &&
    roomTypeInputNewValues.name !== currentRoomType.name
  ) {
    await verifyRoomTypeAlreadyExists(roomTypeInputNewValues.name, userId)
  }

  const roomTypeWithNewValues = {
    ...currentRoomType,
    ...roomTypeInputNewValues,
  }

  const updatedRoomType = await runUpdateQuery(roomTypeWithNewValues)
  return updatedRoomType

  async function runUpdateQuery(roomTypeWithNewValues) {
    const { id, name, description } = roomTypeWithNewValues

    const results = await database.query({
      text: `
        UPDATE
          "room-types"
        SET 
          name = $2,
          description = $3,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
      `,
      values: [id, name, description],
    })

    return results.rows[0]
  }
}

async function deleteById(roomTypeId) {
  await database.query({
    text: `
    DELETE FROM "room-types"
    WHERE id = $1
    `,
    values: [roomTypeId],
  })
}

async function verifyRoomTypeAlreadyExists(name) {
  const results = await database.query({
    text: `
      SELECT *
      FROM "room-types"
      WHERE name = $1
      LIMIT 1
    `,
    values: [name],
  })

  if (results.rowCount > 0) {
    throw new ConflictError({
      message:
        "Já existe um tipo de quarto cadastrado com esse nome no sistema.",
      action:
        "O nome deve ser globalmente único. Escolha outro nome ou edite o tipo de quarto existente.",
    })
  }
}

const roomType = {
  create,
  findOneById,
  findAll,
  update,
  deleteById,
}

export default roomType
