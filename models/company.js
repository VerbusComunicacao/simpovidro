import database from "infra/database.js"
import { ConflictError, ValidationError, NotFoundError } from "infra/errors.js"
import {
  validateRequiredFields as validateRequired,
  validateUUID,
} from "infra/validator.js"

async function create(companyInputValues, options = { isImport: false }) {
  const isImport = options.isImport

  const requiredFields = isImport
    ? ["corporate_name", "cnpj"]
    : [
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
        "zip_code",
      ]

  validateRequired(companyInputValues, requiredFields)

  const cleanCnpj = companyInputValues.cnpj?.replace(/\D/g, "")
  const valuesWithCleanCnpj = { ...companyInputValues, cnpj: cleanCnpj }

  if (cleanCnpj) {
    await verifyIfCompanyAlreadyExists(cleanCnpj)
  }

  const newCompany = await runInsertQuery(valuesWithCleanCnpj)
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
      city = null,
      state = null,
      country = "Brasil",
      phone = null,
      permission = "A",
      discount_id = null,
      custom_discount_percentage = null,
      email = null,
      responsible_person = null,
      zip_code = null,
      last_registration_date = null,
    } = values

    const results = await database.query({
      text: `
        INSERT INTO
          companies (
            corporate_name, badge, cnpj, address, address_number, 
            address_complement, neighborhood, city, state, country, 
            phone, permission, discount_id, custom_discount_percentage, email, 
            responsible_person, zip_code, last_registration_date
          )
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
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
        discount_id,
        custom_discount_percentage,
        email,
        responsible_person,
        zip_code,
        last_registration_date,
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
        c.*,
        d.name as discount_name,
        d.value as discount_value
      FROM 
        companies c
      LEFT JOIN
        discounts d ON c.discount_id = d.id
      ORDER BY 
        c.corporate_name ASC
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

  const cleanCnpj = companyInputNewValues.cnpj?.replace(/\D/g, "")

  if (cleanCnpj && cleanCnpj !== currentCompany.cnpj) {
    await verifyIfCompanyAlreadyExists(cleanCnpj)
  }

  const companyWithNewValues = {
    ...currentCompany,
    ...companyInputNewValues,
    cnpj: cleanCnpj || currentCompany.cnpj,
  }

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
      discount_id,
      custom_discount_percentage,
      email,
      responsible_person,
      zip_code,
      last_registration_date,
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
          discount_id = $14,
          custom_discount_percentage = $15,
          email = $16,
          responsible_person = $17,
          zip_code = $18,
          last_registration_date = $19,
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
        discount_id,
        custom_discount_percentage,
        email,
        responsible_person,
        zip_code,
        last_registration_date,
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
  const cleanCnpj = cnpj.replace(/\D/g, "")
  const results = await database.query({
    text: `
      SELECT id
      FROM companies
      WHERE cnpj = $1
      LIMIT 1
    `,
    values: [cleanCnpj],
  })

  if (results.rowCount > 0) {
    throw new ConflictError({
      message: "Já existe uma empresa cadastrada com este CNPJ.",
      action: "Verifique os dados ou edite a empresa existente.",
    })
  }
}

async function findOneByCnpj(cnpj, client) {
  if (!cnpj) {
    throw new ValidationError({
      message: "CNPJ não informado para busca.",
      action: "Informe um CNPJ válido.",
    })
  }

  const cleanCnpj = cnpj.replace(/\D/g, "")

  const db = client || database
  const results = await db.query({
    text: `SELECT * FROM companies WHERE cnpj = $1 LIMIT 1;`,
    values: [cleanCnpj],
  })

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "Empresa não encontrada para o CNPJ informado.",
      action: "Verifique o número do CNPJ.",
    })
  }

  return results.rows[0]
}

async function deleteAll() {
  await database.query({
    text: `DELETE FROM companies`,
  })
}

const company = {
  create,
  findOneById,
  findAll,
  update,
  deleteById,
  deleteAll,
  findOneByCnpj,
}

export default company
