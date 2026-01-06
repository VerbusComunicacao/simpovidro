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
    text: `${user.full_name}, clique no link abaixo para ativar o seu cadastro no Simpovidro:
    ${activationLink}

    Atenciosamente,
    Equipe Abravidro`,
  })
}

async function activateAccount(token) {
  const client = await database.getNewClient()

  try {
    await client.query("BEGIN")
    const activationToken = await findValidToken(token, client)

    const tokenResults = await client.query({
      text: `
        UPDATE 
          user_activation_tokens 
        SET
          used_at = NOW(),
          updated_at = NOW()
        WHERE
          id = $1
        RETURNING *
      `,
      values: [activationToken.id],
    })

    await client.query({
      text: `
        UPDATE 
          users 
        SET
          features = ARRAY['create:session', 'read:session', 'create:guest', 'read:guest', 'read:user', 'update:user'],
          updated_at = NOW()
        WHERE
          id = $1
      `,
      values: [activationToken.user_id],
    })

    await client.query("COMMIT")

    return tokenResults.rows[0]
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    await client.end()
  }
}

async function activateAdmAccount(token) {
  const client = await database.getNewClient()

  try {
    await client.query("BEGIN")
    const activationToken = await findValidToken(token, client)

    const tokenResults = await client.query({
      text: `
        UPDATE 
          user_activation_tokens 
        SET
          used_at = NOW(),
          updated_at = NOW()
        WHERE
          id = $1
        RETURNING *
      `,
      values: [activationToken.id],
    })

    await client.query({
      text: `
        UPDATE 
          users 
        SET
          features = ARRAY['create:session', 'read:session', 'create:guest', 'read:guest', 'create:hotel', 'read:hotel', 'create:user', 'read:user', 'create:content', 'read:content', 'update:content', 'update:user', 'update:user:others', 'delete:content', 'delete:user', 'delete:user:others', 'read:user:others'],
          updated_at = NOW()
        WHERE
          id = $1
      `,
      values: [activationToken.user_id],
    })

    await client.query("COMMIT")

    return tokenResults.rows[0]
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    await client.end()
  }
}

async function findValidToken(token) {
  const results = await database.query({
    text: `
      SELECT
      *
      FROM
        user_activation_tokens
      WHERE
        token = $1 
        AND expires_at > NOW()
        AND used_at IS NULL
      LIMIT
        1
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

async function isFirstActivation() {
  const activationCountResult = await database.query(
    "SELECT count(*) FROM user_activation_tokens WHERE used_at IS NOT NULL;",
  )
  const activationCount = parseInt(activationCountResult.rows[0].count, 10)
  return activationCount === 0
}

const activation = {
  generateToken,
  sendEmailToUser,
  activateAccount,
  findValidToken,
  activateAdmAccount,
  isFirstActivation,
}

export default activation
