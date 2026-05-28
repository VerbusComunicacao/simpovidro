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

  const sponsorsFooter = `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #f3f4f6; text-align: center;">
        <p style="color: #9ca3af; font-size: 0.8em; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 20px;">Patrocínio</p>
        <div style="display: inline-block;">
          <img src="${webserver.origin}/images/agc-logo.png" alt="AGC" style="height: 30px; margin: 10px 15px; vertical-align: middle;">
          <img src="${webserver.origin}/images/cebrace-logo.webp" alt="Cebrace" style="height: 30px; margin: 10px 15px; vertical-align: middle;">
          <img src="${webserver.origin}/images/glass-guardian-logo.png" alt="Guardian Glass" style="height: 30px; margin: 10px 15px; vertical-align: middle;">
          <img src="${webserver.origin}/images/logo_vivix_nova.png" alt="Vivix" style="height: 30px; margin: 10px 15px; vertical-align: middle;">
        </div>
      </div>
    `

  const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #374151; line-height: 1.5;">
        <div style="background-color: #2563eb; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 1.8em;">Recuperação de Senha</h1>
          <p style="color: #bfdbfe; margin-top: 10px;">Simpovidro 2026</p>
        </div>

        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Olá, <strong>${user.full_name}</strong>!</p>
          <p>Você solicitou a recuperação de sua senha no Simpovidro. Clique no botão abaixo para redefini-la:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${recoveryLink}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Redefinir minha senha</a>
          </div>

          <p style="font-size: 0.85em; color: #6b7280; text-align: center;">
            Este link expira em 1 hora. Se você não solicitou esta alteração, ignore este e-mail.
          </p>

          <p style="font-size: 0.85em; color: #6b7280; text-align: center; margin-top: 20px;">
            Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:<br/>
            <a href="${recoveryLink}" style="color: #2563eb; word-break: break-all;">${recoveryLink}</a>
          </p>

          ${sponsorsFooter}

          <p style="margin-top: 30px; font-size: 0.9em; color: #6b7280; text-align: center;">
            Atenciosamente,<br/>
            <strong>Equipe Abravidro</strong>
          </p>
        </div>
      </div>
    `

  await email.send({
    from: `Simpovidro <simpovidro@abravidro.org.br>`,
    to: user.email,
    subject: "Recuperação de Senha",
    html: emailHtml,
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
