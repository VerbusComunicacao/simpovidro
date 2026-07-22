import database from "infra/database.js"
import crypto from "node:crypto"
import { ValidationError } from "infra/errors.js"
import email from "infra/email.js"
import webserver from "infra/webserver"
import password from "models/password.js"

const EXPIRATION_IN_MILLISECONDS = 60 * 60 * 1000 // 1 hora

async function createToken(userEmail, lang) {
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
  await sendRecoveryEmail(user, token, lang)

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

async function sendRecoveryEmail(user, token, lang) {
  const isEnglish = lang === "en"
  const recoveryLink = isEnglish
    ? `${webserver.origin}/en/reset-password/${token}`
    : `${webserver.origin}/reset-password/${token}`

  const emailHtml = isEnglish
    ? `
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="width: 600px; max-width: 100%; font-family: sans-serif; color: #374151; line-height: 1.5; border-collapse: collapse; margin: 0 auto;">
        <!-- Header Image -->
        <tr>
          <td style="padding: 0; line-height: 0;">
            <img src="${webserver.origin}/images/banner-topo2.png" alt="17th Simpovidro" width="600" style="width: 600px; max-width: 100%; height: auto; display: block; border-radius: 8px 8px 0 0; border: 1px solid #e5e7eb; border-bottom: none;">
          </td>
        </tr>

        <!-- Body Content -->
        <tr>
          <td style="padding: 20px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; background-color: #ffffff; text-align: left;">
            <p>Hello, <strong>${user.full_name}</strong>!</p>
            <p>You requested a password reset for your Simpovidro account. Click the button below to reset your password:</p>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${recoveryLink}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Reset my password</a>
            </p>

            <p style="font-size: 0.85em; color: #6b7280; text-align: center;">
              This link expires in 1 hour. If you did not request this change, please ignore this email.
            </p>

            <p style="font-size: 0.85em; color: #6b7280; text-align: center; margin-bottom: 30px;">
              If the button above does not work, copy and paste the link below into your browser:<br/>
              <a href="${recoveryLink}" style="color: #2563eb; word-break: break-all;">${recoveryLink}</a>
            </p>

            <p style="margin-top: 30px; font-size: 0.95em; color: #4b5563;">
              Best regards,<br/><br/>
              <strong>Simpovidro Team</strong>
            </p>
          </td>
        </tr>

        <!-- Footer Image -->
        <tr>
          <td style="padding: 0; line-height: 0;">
            <img src="${webserver.origin}/images/banner-rodape2.png" alt="Sponsors and Organizers" width="600" style="width: 600px; max-width: 100%; height: auto; display: block; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
          </td>
        </tr>
      </table>
    `
    : `
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="width: 600px; max-width: 100%; font-family: sans-serif; color: #374151; line-height: 1.5; border-collapse: collapse; margin: 0 auto;">
        <!-- Header Image -->
        <tr>
          <td style="padding: 0; line-height: 0;">
            <img src="${webserver.origin}/images/banner-topo2.png" alt="17º Simpovidro" width="600" style="width: 600px; max-width: 100%; height: auto; display: block; border-radius: 8px 8px 0 0; border: 1px solid #e5e7eb; border-bottom: none;">
          </td>
        </tr>

        <!-- Body Content -->
        <tr>
          <td style="padding: 20px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; background-color: #ffffff; text-align: left;">
            <p>Olá, <strong>${user.full_name}</strong>!</p>
            <p>Você solicitou a recuperação de sua senha no Simpovidro. Clique no botão abaixo para redefini-la:</p>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${recoveryLink}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Redefinir minha senha</a>
            </p>

            <p style="font-size: 0.85em; color: #6b7280; text-align: center;">
              Este link expira em 1 hora. Se você não solicitou esta alteração, ignore este e-mail.
            </p>

            <p style="font-size: 0.85em; color: #6b7280; text-align: center; margin-bottom: 30px;">
              Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:<br/>
              <a href="${recoveryLink}" style="color: #2563eb; word-break: break-all;">${recoveryLink}</a>
            </p>

            <p style="margin-top: 30px; font-size: 0.95em; color: #4b5563;">
              Atenciosamente,<br/><br/>
              <strong>Equipe Abravidro</strong>
            </p>
          </td>
        </tr>

        <!-- Footer Image -->
        <tr>
          <td style="padding: 0; line-height: 0;">
            <img src="${webserver.origin}/images/banner-rodape2.png" alt="Patrocinadores e Realização" width="600" style="width: 600px; max-width: 100%; height: auto; display: block; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
          </td>
        </tr>
      </table>
    `

  await email.send({
    from: `Simpovidro <simpovidro@abravidro.org.br>`,
    to: user.email,
    subject: isEnglish ? "Password Recovery" : "Recuperação de Senha",
    html: emailHtml,
    text: isEnglish
      ? `Hello ${user.full_name}, click on the link below to reset your password at Simpovidro:\n    ${recoveryLink}\n\n    Best regards,\n    Simpovidro Team`
      : `Olá ${user.full_name}, clique no link abaixo para redefinir sua senha no Simpovidro:\n    ${recoveryLink}\n\n    Atenciosamente,\n    Equipe Abravidro`,
  })
}

async function findValidToken(token, lang) {
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
      message:
        lang === "en"
          ? "Invalid or expired recovery token."
          : "Token de recuperação inválido ou expirado.",
      action:
        lang === "en"
          ? "Please request a new password recovery link."
          : "Solicite um novo link de recuperação de senha.",
    })
  }

  return results.rows[0]
}

async function resetPassword(token, newPassword, lang) {
  const recoveryTokenRow = await findValidToken(token, lang)

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
