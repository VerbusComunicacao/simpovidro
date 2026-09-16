import database from "infra/database.js"
import { ValidationError, NotFoundError } from "infra/errors.js"

const VALID_TOURNAMENTS = ["futebol", "volei", "tenis"]

function validateRegistrationItem(item) {
  if (!item || typeof item !== "object") {
    throw new ValidationError({
      message: "Dados da inscrição inválidos.",
      action: "Envie um objeto com os dados do participante.",
    })
  }

  const { tournament, company_name, participant_name, phone } = item

  if (!tournament || typeof tournament !== "string") {
    throw new ValidationError({
      message: "O torneio deve ser informado.",
      action: "Selecione futebol, volei ou tenis.",
    })
  }

  const normalizedTournament = tournament.trim().toLowerCase()
  if (!VALID_TOURNAMENTS.includes(normalizedTournament)) {
    throw new ValidationError({
      message: `Torneio "${tournament}" inválido.`,
      action: "Os torneios oficiais permitidos são: futebol, volei e tenis.",
    })
  }

  if (
    !company_name ||
    typeof company_name !== "string" ||
    company_name.trim().length === 0
  ) {
    throw new ValidationError({
      message: "O nome da empresa é obrigatório.",
      action: "Informe o nome da empresa do participante.",
    })
  }

  if (
    !participant_name ||
    typeof participant_name !== "string" ||
    participant_name.trim().length === 0
  ) {
    throw new ValidationError({
      message: "O nome do participante é obrigatório.",
      action: "Informe o nome completo do participante.",
    })
  }

  if (!phone || typeof phone !== "string" || phone.trim().length === 0) {
    throw new ValidationError({
      message: "O celular do participante é obrigatório.",
      action: "Informe o número de telefone celular com DDD.",
    })
  }

  const cleanPhone = phone.replace(/\D/g, "")
  if (cleanPhone.length < 8) {
    throw new ValidationError({
      message: "O celular informado é inválido.",
      action: "Informe um número de celular válido com DDD.",
    })
  }

  return {
    tournament: normalizedTournament,
    company_name: company_name.trim(),
    participant_name: participant_name.trim(),
    phone: phone.trim(),
  }
}

async function create(registrationData, userId) {
  if (!userId) {
    throw new ValidationError({
      message: "Usuário não autenticado para realizar inscrição.",
      action: "Faça login antes de se inscrever.",
    })
  }

  const validated = validateRegistrationItem(registrationData)

  const result = await database.query({
    text: `
      INSERT INTO tournament_registrations (
        user_id,
        tournament,
        company_name,
        participant_name,
        phone
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `,
    values: [
      userId,
      validated.tournament,
      validated.company_name,
      validated.participant_name,
      validated.phone,
    ],
  })

  return result.rows[0]
}

async function createMany(registrationsArray, userId) {
  if (!userId) {
    throw new ValidationError({
      message: "Usuário não autenticado para realizar inscrição.",
      action: "Faça login antes de se inscrever.",
    })
  }

  if (!Array.isArray(registrationsArray) || registrationsArray.length === 0) {
    throw new ValidationError({
      message: "A lista de participantes não pode estar vazia.",
      action: "Adicione ao menos um participante para prosseguir.",
    })
  }

  const validatedList = registrationsArray.map(validateRegistrationItem)

  const createdList = []
  for (const item of validatedList) {
    const result = await database.query({
      text: `
        INSERT INTO tournament_registrations (
          user_id,
          tournament,
          company_name,
          participant_name,
          phone
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `,
      values: [
        userId,
        item.tournament,
        item.company_name,
        item.participant_name,
        item.phone,
      ],
    })
    createdList.push(result.rows[0])
  }

  return createdList
}

async function findByUserId(userId) {
  if (!userId) {
    throw new ValidationError({
      message: "ID do usuário não especificado.",
      action: "Informe o ID do usuário para consultar as inscrições.",
    })
  }

  const result = await database.query({
    text: `
      SELECT *
      FROM tournament_registrations
      WHERE user_id = $1
      ORDER BY created_at DESC;
    `,
    values: [userId],
  })

  return result.rows
}

async function findById(id) {
  if (!id) {
    throw new ValidationError({
      message: "ID da inscrição não informado.",
      action: "Informe o ID da inscrição a ser consultada.",
    })
  }

  const result = await database.query({
    text: `
      SELECT *
      FROM tournament_registrations
      WHERE id = $1
      LIMIT 1;
    `,
    values: [id],
  })

  if (result.rowCount === 0) {
    throw new NotFoundError({
      message: "Inscrição não encontrada no sistema.",
      action: "Verifique se o ID informado está correto.",
    })
  }

  return result.rows[0]
}

async function deleteById(id, userId, userFeatures = []) {
  const item = await findById(id)

  const isOwner = item.user_id === userId
  const isAdmin =
    userFeatures.includes("create:content") ||
    userFeatures.includes("read:sale:others")

  if (!isOwner && !isAdmin) {
    throw new ValidationError({
      message: "Você não tem permissão para remover esta inscrição.",
      action: "Você só pode remover inscrições criadas por você.",
    })
  }

  const result = await database.query({
    text: `
      DELETE FROM tournament_registrations
      WHERE id = $1
      RETURNING *;
    `,
    values: [id],
  })

  return result.rows[0]
}

async function findAll(filters = {}) {
  let queryText = `
    SELECT 
      tr.id,
      tr.user_id,
      tr.tournament,
      tr.company_name,
      tr.participant_name,
      tr.phone,
      tr.created_at,
      tr.updated_at,
      u.full_name as registered_by_name,
      u.email as registered_by_email
    FROM tournament_registrations tr
    LEFT JOIN users u ON tr.user_id = u.id
  `
  const values = []

  if (filters.tournament) {
    values.push(filters.tournament.toLowerCase())
    queryText += ` WHERE LOWER(tr.tournament) = $1`
  }

  queryText += ` ORDER BY tr.tournament ASC, tr.created_at ASC;`

  const result = await database.query({
    text: queryText,
    values,
  })

  return result.rows
}

async function getDefaults(userId) {
  if (!userId) return null

  // 1. Get user details
  const userResult = await database.query({
    text: `SELECT full_name, email FROM users WHERE id = $1 LIMIT 1`,
    values: [userId],
  })
  if (userResult.rowCount === 0) return null

  const user = userResult.rows[0]
  let participantName = user.full_name || ""
  let phone = ""
  let companyName = ""

  // 2. Check previous tournament registration
  const prevTourResult = await database.query({
    text: `
      SELECT company_name, phone, participant_name 
      FROM tournament_registrations 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `,
    values: [userId],
  })
  if (prevTourResult.rowCount > 0) {
    companyName = prevTourResult.rows[0].company_name || ""
    phone = prevTourResult.rows[0].phone || ""
  }

  // 3. If phone is still empty, look up in guests
  if (!phone) {
    const guestResult = await database.query({
      text: `
        SELECT g.phone, g.name, g.company_cnpj 
        FROM guests g 
        WHERE g.user_id = $1 OR LOWER(g.email) = LOWER($2) 
        ORDER BY g.created_at DESC 
        LIMIT 1
      `,
      values: [userId, user.email],
    })
    if (guestResult.rowCount > 0) {
      if (!phone && guestResult.rows[0].phone) phone = guestResult.rows[0].phone
      if (!participantName && guestResult.rows[0].name)
        participantName = guestResult.rows[0].name
    }
  }

  // 4. If companyName is still empty, look up in sales & companies
  if (!companyName) {
    const companyResult = await database.query({
      text: `
        SELECT c.corporate_name, c.badge 
        FROM companies c 
        JOIN sales s ON s.company_id = c.id 
        WHERE s.user_id = $1 
        ORDER BY s.created_at DESC 
        LIMIT 1
      `,
      values: [userId],
    })
    if (companyResult.rowCount > 0) {
      companyName =
        companyResult.rows[0].corporate_name ||
        companyResult.rows[0].badge ||
        ""
    }
  }

  // 5. If companyName is still empty, look up from guest's company_cnpj
  if (!companyName) {
    const guestCompanyResult = await database.query({
      text: `
        SELECT c.corporate_name, c.badge 
        FROM companies c 
        JOIN guests g ON (
          g.company_cnpj IS NOT NULL 
          AND (c.cnpj = g.company_cnpj OR REPLACE(REPLACE(REPLACE(c.cnpj, '.', ''), '-', ''), '/', '') = REPLACE(REPLACE(REPLACE(g.company_cnpj, '.', ''), '-', ''), '/', ''))
        )
        WHERE g.user_id = $1 OR LOWER(g.email) = LOWER($2)
        LIMIT 1
      `,
      values: [userId, user.email],
    })
    if (guestCompanyResult.rowCount > 0) {
      companyName =
        guestCompanyResult.rows[0].corporate_name ||
        guestCompanyResult.rows[0].badge ||
        ""
    }
  }

  return {
    participant_name: participantName,
    company_name: companyName,
    phone: phone,
  }
}

const tournament = {
  VALID_TOURNAMENTS,
  create,
  createMany,
  findByUserId,
  findById,
  deleteById,
  findAll,
  getDefaults,
}

export default tournament
