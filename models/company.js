import database from "infra/database.js"
import { ConflictError, ValidationError, NotFoundError } from "infra/errors.js"
import {
  validateRequiredFields as validateRequired,
  validateUUID,
} from "infra/validator.js"

async function create(companyInputValues, options = { isImport: false }) {
  const isImport = options.isImport
  const isForeign = (companyInputValues.country && companyInputValues.country !== "Brasil")
  const db = options.client || database

  const requiredFields = isImport
    ? (isForeign ? ["corporate_name"] : ["corporate_name", "cnpj"])
    : [
        "corporate_name",
        "badge",
        "address",
        "address_number",
        "neighborhood",
        "city",
        "state",
        "phone",
        "email",
        "zip_code",
      ]

  if (!isImport && !isForeign) {
    requiredFields.push("cnpj")
  }

  validateRequired(companyInputValues, requiredFields)

  const cleanCnpj = companyInputValues.cnpj?.replace(/\D/g, "")
  const valuesWithCleanCnpj = { ...companyInputValues, cnpj: cleanCnpj || null }

  if (cleanCnpj) {
    await verifyIfCompanyAlreadyExists(cleanCnpj, db)
  }

  const newCompany = await runInsertQuery(valuesWithCleanCnpj, db)
  return newCompany

  async function runInsertQuery(values, dbClient) {
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
      activity_sector = null,
    } = values

    const results = await dbClient.query({
      text: `
        INSERT INTO
          companies (
            corporate_name, badge, cnpj, address, address_number, 
            address_complement, neighborhood, city, state, country, 
            phone, permission, discount_id, custom_discount_percentage, email, 
            responsible_person, zip_code, last_registration_date, activity_sector
          )
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING
          *
      `,
      values: [
        corporate_name,
        badge?.toUpperCase(),
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
        activity_sector,
      ],
    })

    return results.rows[0]
  }
}

async function findOneById(companyId, client) {
  validateUUID(companyId)
  const db = client || database
  const results = await db.query({
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

async function update(companyId, companyInputNewValues, client) {
  if (Object.keys(companyInputNewValues).length === 0) {
    throw new ValidationError({
      message: `Nenhum campo enviado para atualização.`,
      action: "Envie algum campo e tente novamente.",
    })
  }

  const db = client || database
  const currentCompany = await findOneById(companyId, db)

  const cleanCnpj = companyInputNewValues.cnpj?.replace(/\D/g, "")

  if (cleanCnpj && cleanCnpj !== currentCompany.cnpj) {
    await verifyIfCompanyAlreadyExists(cleanCnpj, db)
  }

  const companyWithNewValues = {
    ...currentCompany,
    ...companyInputNewValues,
    cnpj: cleanCnpj || currentCompany.cnpj,
  }

  const updatedCompany = await runUpdateQuery(companyWithNewValues, db)
  return updatedCompany

  async function runUpdateQuery(values, dbClient) {
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
      activity_sector,
    } = values

    const results = await dbClient.query({
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
          activity_sector = $20,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
      `,
      values: [
        id,
        corporate_name,
        badge?.toUpperCase(),
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
        activity_sector,
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

async function verifyIfCompanyAlreadyExists(cnpj, client) {
  const cleanCnpj = cnpj.replace(/\D/g, "")
  const db = client || database
  const results = await db.query({
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

async function searchForeignCompanies(searchTerm) {
  if (!searchTerm || searchTerm.trim() === "") return []
  const results = await database.query({
    text: `
      SELECT *
      FROM companies
      WHERE cnpj IS NULL
        AND corporate_name ILIKE $1
      ORDER BY corporate_name ASC
      LIMIT 10;
    `,
    values: [`%${searchTerm.trim()}%`],
  })
  return results.rows
}

async function deleteAll() {
  await database.query({
    text: `DELETE FROM companies`,
  })
}

async function upsert(companyData, client) {
  const cleanCnpj = companyData.cnpj?.replace(/\D/g, "")
  const db = client || database

  let existingCompany = null
  if (cleanCnpj) {
    try {
      existingCompany = await findOneByCnpj(cleanCnpj, db)
    } catch (error) {
      if (error.name !== "NotFoundError") {
        throw error
      }
    }
  } else if (companyData.corporate_name) {
    const findResult = await db.query({
      text: `SELECT * FROM companies WHERE LOWER(corporate_name) = LOWER($1) AND cnpj IS NULL LIMIT 1;`,
      values: [companyData.corporate_name.trim()],
    })
    if (findResult.rowCount > 0) {
      existingCompany = findResult.rows[0]
    }
  }

  if (existingCompany) {
    return await update(existingCompany.id, companyData, db)
  }

  return await runInsertQuery(companyData, db)

  async function runInsertQuery(values, dbClient) {
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
      activity_sector = null,
    } = values

    const results = await dbClient.query({
      text: `
        INSERT INTO
          companies (
            corporate_name, badge, cnpj, address, address_number, 
            address_complement, neighborhood, city, state, country, 
            phone, permission, discount_id, custom_discount_percentage, email, 
            responsible_person, zip_code, last_registration_date, activity_sector
          )
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING
          *
      `,
      values: [
        corporate_name,
        badge?.toUpperCase(),
        cnpj ? cnpj.replace(/\D/g, "") : null,
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
        activity_sector,
      ],
    })

    return results.rows[0]
  }
}

const company = {
  create,
  findOneById,
  findAll,
  update,
  deleteById,
  deleteAll,
  findOneByCnpj,
  upsert,
  searchForeignCompanies,
}

export default company
