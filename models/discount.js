import database from "infra/database.js"
import { NotFoundError, ValidationError } from "infra/errors.js"
import { validateUUID, validateRequiredFields } from "infra/validator.js"

async function create(discountInputValues) {
  validateRequiredFields(discountInputValues, ["name", "value"])

  const newDiscount = await runInsertQuery(discountInputValues)
  return newDiscount

  async function runInsertQuery(values) {
    const { name, value } = values

    const results = await database.query({
      text: `
        INSERT INTO
          discounts (name, value)
        VALUES
          ($1, $2)
        RETURNING
          *
      `,
      values: [name, value],
    })

    return results.rows[0]
  }
}

async function findOneById(discountId) {
  validateUUID(discountId)
  const results = await database.query({
    text: `SELECT * FROM discounts WHERE id = $1 LIMIT 1;`,
    values: [discountId],
  })

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "O ID do desconto informado não foi encontrado no sistema.",
      action: "Verifique se o ID está digitado corretamente.",
    })
  }

  return results.rows[0]
}

async function findAll() {
  const results = await database.query({
    text: `
      SELECT 
        *
      FROM 
        discounts
      ORDER BY 
        name ASC
    `,
  })

  return results.rows
}

async function update(discountId, discountInputNewValues) {
  if (Object.keys(discountInputNewValues).length === 0) {
    throw new ValidationError({
      message: `Nenhum campo enviado para atualização.`,
      action: "Envie algum campo e tente novamente.",
    })
  }

  const currentDiscount = await findOneById(discountId)

  const discountWithNewValues = {
    ...currentDiscount,
    ...discountInputNewValues,
  }

  const updatedDiscount = await runUpdateQuery(discountWithNewValues)
  return updatedDiscount

  async function runUpdateQuery(values) {
    const { id, name, value } = values

    const results = await database.query({
      text: `
        UPDATE
          discounts
        SET 
          name = $2,
          value = $3,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
      `,
      values: [id, name, value],
    })

    return results.rows[0]
  }
}

async function deleteById(discountId) {
  validateUUID(discountId)

  await database.query({
    text: `DELETE FROM discounts WHERE id = $1`,
    values: [discountId],
  })
}

async function getAllActiveDiscounts() {
  const results = await database.query({
    text: `
      SELECT 
        *
      FROM 
        discounts
      ORDER BY 
        name ASC
    `,
  })

  return results.rows
}

const discount = {
  create,
  findOneById,
  findAll,
  update,
  deleteById,
  getAllActiveDiscounts,
}

export default discount
