import email from "infra/email.js"
import database from "infra/database.js"
import crypto from "node:crypto"
import { ValidationError } from "infra/errors.js"
import webserver from "infra/webserver"

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000 // 15 minutos

async function generateToken(userId) {
  const token = crypto.randomBytes(48).toString("hex")
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS)

  const newToken = await runInsertQuery(token, userId, expiresAt)
  return newToken

  async function runInsertQuery(token, userId, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO 
          user_activation_tokens (token, user_id, expires_at)
        VALUES ($1, $2, $3)
        RETURNING *
      `,
      values: [token, userId, expiresAt],
    })

    return results.rows[0].token
  }
}

async function sendEmailToUser(user, activationToken) {
  const activationLink = `${webserver.origin}/cadastro/ativar/${activationToken}`

  await email.send({
    from: "Peregrinos <contato@peregrinos.com.br>",
    to: user.email,
    subject: "Ative seu cadastro!",
    text: `${user.username}, clique no link abaixo para ativar o seu cadastro em Peregrinos:
    ${activationLink}

    Atenciosamente,
    Equipe Peregrinos`,
  })
}

async function activateAccount(token) {
  const activationToken = await findValidToken(token)

  // Marcar token como usado
  await database.query({
    text: `
      UPDATE 
        user_activation_tokens 
      SET
        used_at = NOW(),
        updated_at = NOW()
      WHERE
        id = $1
    `,
    values: [activationToken.id],
  })

  // Atualizar features do usuário
  await database.query({
    text: `
      UPDATE 
        users 
      SET
        features = array_append(features, 'create:session'),
        updated_at = NOW()
      WHERE
        id = $1
    `,
    values: [activationToken.user_id],
  })

  return {
    id: activationToken.user_id,
    username: activationToken.username,
    email: activationToken.email,
  }
}

async function findOneByUserId(userId) {
  const results = await database.query({
    text: `
      SELECT 
        *
      FROM
        user_activation_tokens
      WHERE
        user_id = $1 
      LIMIT
        1
    `,
    values: [userId],
  })

  if (results.rowCount === 0) return null

  return results.rows[0].token
}

async function findValidToken(token) {
  const results = await database.query({
    text: `
      SELECT at.*, u.* 
      FROM user_activation_tokens at
      JOIN users u ON at.user_id = u.id
      WHERE at.token = $1 
        AND at.expires_at > NOW()
        AND at.used_at IS null
    `,
    values: [token],
  })

  if (results.rowCount === 0) {
    throw new ValidationError({
      message: "Token inválido ou expirado",
      action: "Solicite um novo email de ativação",
    })
  }

  return results.rows[0]
}

const activation = {
  generateToken,
  sendEmailToUser,
  activateAccount,
  findValidToken,
  findOneByUserId,
}

export default activation
