import database from "infra/database.js"
import { ConflictError, ValidationError, NotFoundError } from "infra/errors.js"
import {
  validateRequiredFields as validateRequired,
  validateUUID,
} from "infra/validator.js"

async function create(companyInputValues, hotelId) {
  validateRequired(companyInputValues, ["name", "cnpj"])
  await verifyIfCompanyAlreadyExists(companyInputValues.cnpj)

  const newCompany = await runInsertQuery(companyInputValues, hotelId)
  return newCompany

  async function runInsertQuery(companyInputValues, hotelId) {
    const { name, email = null, phone = null, cnpj } = companyInputValues

    const results = await database.query({
      text: `
        INSERT INTO
          companies (hotel_id, name, email, phone, cnpj)
        VALUES
          ($1, $2, $3, $4, $5)
        RETURNING
          *
      `,
      values: [hotelId, name, email, phone, cnpj],
    })

    return results.rows[0]
  }
}

async function findOneById(companyId) {
  validateUUID(companyId)
  const companyFound = await runSelectQuery(companyId)
  return companyFound

  async function runSelectQuery(companyId) {
    const results = await database.query({
      text: `
        SELECT 
          * 
        FROM 
          companies
        WHERE 
          id = $1
        LIMIT
          1
        ;`,
      values: [companyId],
    })

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O ID da empresa informado não foi encontrado no sistema.",
        action: "Verifique se o ID está digitado corretamente.",
      })
    }

    return results.rows[0]
  }
}

async function findAllByHotelId(hotelId) {
  const results = await database.query({
    text: `
      SELECT 
        *
      FROM 
        companies
      WHERE 
        hotel_id = $1
      ORDER BY 
        created_at DESC
    `,
    values: [hotelId],
  })

  return results.rows
}

async function findAllByHotelIdAndUserId(hotelId, userId) {
  validateUUID(hotelId)
  validateUUID(userId)

  const results = await database.query({
    text: `
      SELECT
        c.*
      FROM
        companies c
      INNER JOIN
        hotels h ON c.hotel_id = h.id
      WHERE
        c.hotel_id = $1
        AND h.user_id = $2
      ORDER BY
        c.created_at DESC
    `,
    values: [hotelId, userId],
  })

  return results.rows
}

async function update(companyId, companyInputNewValues) {
  if (Object.keys(companyInputNewValues).length === 0) {
    throw new ValidationError({
      message: `Nenhum campo enviado para atualização.`,
      action: "Envie algum campo e tente novamente.",
    })
  }

  const currentCompany = await findOneById(companyId)

  if (Object.keys(companyInputNewValues).length > 0) {
    validateRequired(companyInputNewValues, ["name", "email"])
  }

  if (
    "cnpj" in companyInputNewValues &&
    companyInputNewValues.cnpj !== currentCompany.cnpj
  ) {
    await verifyIfCompanyAlreadyExists(companyInputNewValues.cnpj)
  }

  const companyWithNewValues = { ...currentCompany, ...companyInputNewValues }

  const updatedCompany = await runUpdateQuery(companyWithNewValues)
  return updatedCompany

  async function runUpdateQuery(companyWithNewValues) {
    const { id, name, email, phone, cnpj } = companyWithNewValues

    const results = await database.query({
      text: `
        UPDATE
          companies
        SET 
          name = $2,
          email = $3,
          phone = $4,
          cnpj = $5,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
      `,
      values: [id, name, email, phone, cnpj],
    })

    return results.rows[0]
  }
}

async function deleteById(companyId, hotelId) {
  validateUUID(companyId)
  validateUUID(hotelId)

  await database.query({
    text: `
    DELETE FROM companies
    WHERE hotel_id = $1 and id = $2
    `,
    values: [hotelId, companyId],
  })
}

async function findOneByIdAndUserId(companyId, userId) {
  validateUUID(companyId)
  validateUUID(userId)

  const results = await database.query({
    text: `
      SELECT
        c.*
      FROM
        companies c
      INNER JOIN
        hotels h ON c.hotel_id = h.id
      WHERE
        c.id = $1
        AND h.user_id = $2
      LIMIT 1
    `,
    values: [companyId, userId],
  })

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "O ID da empresa informado não foi encontrado no sistema.",
      action: "Verifique se o ID está digitado corretamente.",
    })
  }

  return results.rows[0]
}

async function verifyIfCompanyAlreadyExists(cnpj) {
  const results = await database.query({
    text: `
      SELECT *
      FROM companies
      WHERE cnpj = $1
      LIMIT 1
    `,
    values: [cnpj],
  })

  if (results.rowCount > 0) {
    throw new ConflictError({
      message: "Já existe uma empresa cadastrada com este CNPJ.",
      action: "Escolha outro email ou edite a empresa existente.",
    })
  }
}

async function findOneByCnpj(cnpj) {
  if (!cnpj) {
    throw new ValidationError({
      message: "CNPJ não informado para busca.",
      action: "Informe um CNPJ válido.",
    })
  }

  const results = await database.query({
    text: `
      SELECT * FROM companies WHERE cnpj = $1 LIMIT 1;
    `,
    values: [cnpj],
  })

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "Empresa não encontrada para o CNPJ informado.",
      action: "Verifique o número do CNPJ.",
    })
  }

  return results.rows[0]
}

const company = {
  create,
  findOneById,
  findOneByIdAndUserId,
  findAllByHotelId,
  findAllByHotelIdAndUserId,
  update,
  deleteById,
  findOneByCnpj,
}

export default company
