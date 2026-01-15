import database from "infra/database.js"
import crypto from "node:crypto"
import { ValidationError } from "infra/errors.js"
import email from "infra/email.js"
import webserver from "infra/webserver"
import password from "models/password.js"

const EXPIRATION_IN_MILLISECONDS = 60 * 60 * 1000 // 1 hora

async function createToken(userEmail) {
  const userResults = await database.query({
    text: "SELECT id, full_name, email FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
    values: [userEmail],
  })

  if (userResults.rowCount === 0) {
    return null
  }

  const user = userResults.rows[0]
  const token = crypto.randomBytes(48).toString("hex")
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS)

  await runInsertQuery(token, user.id, expiresAt)
  await sendRecoveryEmail(user, token)

  return token

  async function runInsertQuery(token, userId, expiresAt) {
    await database.query({
      text: `
        INSERT INTO 
          password_recovery_tokens (token, user_id, expires_at)
        VALUES ($1, $2, $3)
      `,
      values: [token, userId, expiresAt],
    })
  }
}

async function sendRecoveryEmail(user, token) {
  const recoveryLink = `${webserver.origin}/reset-password/${token}`

  await email.send({
    from: "Abravidro <contato@resend.dev>",
    to: user.email,
    subject: "Recuperação de Senha",
    text: `Olá ${user.full_name}, você solicitou a recuperação de sua senha no Simpovidro.
    
    Clique no link abaixo para redefini-la:
    ${recoveryLink}

    Este link expira em 1 hora. Se você não solicitou esta alteração, ignore este e-mail.

    Atenciosamente,
    Equipe Abravidro`,
  })
}

async function findValidToken(token) {
  const results = await database.query({
    text: `
      SELECT
        *
      FROM
        password_recovery_tokens
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
      message: "Token de recuperação inválido ou expirado.",
      action: "Solicite um novo link de recuperação de senha.",
    })
  }

  return results.rows[0]
}

async function resetPassword(token, newPassword) {
  const recoveryTokenRow = await findValidToken(token)

  const client = await database.getNewClient()

  try {
    await client.query("BEGIN")

    // 1. Marcar token como usado
    await client.query({
      text: "UPDATE password_recovery_tokens SET used_at = NOW() WHERE id = $1",
      values: [recoveryTokenRow.id],
    })

    // 2. Atualizar senha do usuário
    const passwordHash = await password.hash(newPassword)
    await client.query({
      text: "UPDATE users SET password = $2, updated_at = NOW() WHERE id = $1",
      values: [recoveryTokenRow.user_id, passwordHash],
    })

    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    await client.end()
  }
}

const passwordRecovery = {
  createToken,
  findValidToken,
  resetPassword,
}

export default passwordRecovery
