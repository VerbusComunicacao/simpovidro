import database from "infra/database.js"
import { ConflictError, ValidationError, NotFoundError } from "infra/errors.js"
import {
  validateRequiredFields as validateRequired,
  validateUUID,
} from "infra/validator.js"

async function create(companyInputValues) {
  validateRequired(companyInputValues, [
    "corporate_name",
    "badge",
    "cnpj",
    "address",
    "address_number",
    "neighborhood",
    "city",
    "state",
    "phone",
    "email",
    "responsible_person",
    "zip_code",
    "permission",
    "discount_status",
  ])

  if (companyInputValues.cnpj) {
    await verifyIfCompanyAlreadyExists(companyInputValues.cnpj)
  }

  const newCompany = await runInsertQuery(companyInputValues)
  return newCompany

  async function runInsertQuery(values) {
    const {
      corporate_name,
      badge = null,
      cnpj = null,
      address = null,
      address_number = null,
      address_complement = null,
      neighborhood = null,
      city,
      state = null,
      country = "Brasil",
      phone = null,
      permission = "A",
      discount_status = "N",
      email = null,
      responsible_person = null,
      zip_code = null,
    } = values

    const results = await database.query({
      text: `
        INSERT INTO
          companies (
            corporate_name, badge, cnpj, address, address_number, 
            address_complement, neighborhood, city, state, country, 
            phone, permission, discount_status, email, responsible_person, 
            zip_code
          )
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING
          *
      `,
      values: [
        corporate_name,
        badge,
        cnpj,
        address,
        address_number,
        address_complement,
        neighborhood,
        city,
        state,
        country,
        phone,
        permission,
        discount_status,
        email,
        responsible_person,
        zip_code,
      ],
    })

    return results.rows[0]
  }
}

async function findOneById(companyId) {
  validateUUID(companyId)
  const results = await database.query({
    text: `SELECT * FROM companies WHERE id = $1 LIMIT 1;`,
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

async function findAll() {
  const results = await database.query({
    text: `
      SELECT 
        *
      FROM 
        companies
      ORDER BY 
        corporate_name ASC
    `,
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

  if (
    "cnpj" in companyInputNewValues &&
    companyInputNewValues.cnpj &&
    companyInputNewValues.cnpj !== currentCompany.cnpj
  ) {
    await verifyIfCompanyAlreadyExists(companyInputNewValues.cnpj)
  }

  const companyWithNewValues = { ...currentCompany, ...companyInputNewValues }

  const updatedCompany = await runUpdateQuery(companyWithNewValues)
  return updatedCompany

  async function runUpdateQuery(values) {
    const {
      id,
      corporate_name,
      badge,
      cnpj,
      address,
      address_number,
      address_complement,
      neighborhood,
      city,
      state,
      country,
      phone,
      permission,
      discount_status,
      email,
      responsible_person,
      zip_code,
    } = values

    const results = await database.query({
      text: `
        UPDATE
          companies
        SET 
          corporate_name = $2,
          badge = $3,
          cnpj = $4,
          address = $5,
          address_number = $6,
          address_complement = $7,
          neighborhood = $8,
          city = $9,
          state = $10,
          country = $11,
          phone = $12,
          permission = $13,
          discount_status = $14,
          email = $15,
          responsible_person = $16,
          zip_code = $17,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
      `,
      values: [
        id,
        corporate_name,
        badge,
        cnpj,
        address,
        address_number,
        address_complement,
        neighborhood,
        city,
        state,
        country,
        phone,
        permission,
        discount_status,
        email,
        responsible_person,
        zip_code,
      ],
    })

    return results.rows[0]
  }
}

async function deleteById(companyId) {
  validateUUID(companyId)

  await database.query({
    text: `DELETE FROM companies WHERE id = $1`,
    values: [companyId],
  })
}

async function verifyIfCompanyAlreadyExists(cnpj) {
  const results = await database.query({
    text: `
      SELECT id
      FROM companies
      WHERE cnpj = $1
      LIMIT 1
    `,
    values: [cnpj],
  })

  if (results.rowCount > 0) {
    throw new ConflictError({
      message: "Já existe uma empresa cadastrada com este CNPJ.",
      action: "Verifique os dados ou edite a empresa existente.",
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
    text: `SELECT * FROM companies WHERE cnpj = $1 LIMIT 1;`,
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
  findAll,
  update,
  deleteById,
  findOneByCnpj,
}

export default company
