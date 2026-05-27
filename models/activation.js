import email from "infra/email.js"
import database from "infra/database.js"
import crypto from "node:crypto"
import { ValidationError } from "infra/errors.js"
import webserver from "infra/webserver"

const EXPIRATION_IN_MILLISECONDS = 60 * 60 * 24 * 1000 // 24 horas

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

  const sponsorsFooter = `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #f3f4f6; text-align: center;">
        <p style="color: #9ca3af; font-size: 0.8em; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 20px;">Patrocínio</p>
        <div style="display: inline-block;">
          <img src="${webserver.origin}/images/agc-logo.png" alt="AGC" style="height: 30px; margin: 10px 15px; vertical-align: middle;">
          <img src="${webserver.origin}/images/cebrace-logo.webp" alt="Cebrace" style="height: 30px; margin: 10px 15px; vertical-align: middle;">
          <img src="${webserver.origin}/images/glass-guardian-logo.png" alt="Guardian Glass" style="height: 30px; margin: 10px 15px; vertical-align: middle;">
          <img src="${webserver.origin}/images/logo_vivix.png" alt="Vivix" style="height: 30px; margin: 10px 15px; vertical-align: middle;">
        </div>
      </div>
    `

  const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #374151; line-height: 1.5;">
        <div style="background-color: #2563eb; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 1.8em;">Ative sua conta</h1>
          <p style="color: #bfdbfe; margin-top: 10px;">Simpovidro 2026</p>
        </div>

        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Olá, <strong>${user.full_name}</strong>!</p>
          <p>Falta pouco para você completar sua inscrição no Simpovidro 2026. Clique no botão abaixo para ativar seu cadastro:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${activationLink}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Ativar minha conta</a>
          </div>

          <p style="font-size: 0.85em; color: #6b7280; text-align: center;">
            Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:<br/>
            <a href="${activationLink}" style="color: #2563eb; word-break: break-all;">${activationLink}</a>
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
    from: "Abravidro <simpovidro@abravidro.org.br>",
    to: user.email,
    subject: "Ative seu cadastro!",
    html: emailHtml,
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

    if (activationToken.alreadyUsed) {
      await client.query("ROLLBACK")
      return {
        message: "Sua conta já havia sido ativada! Você pode fazer login.",
        user_id: activationToken.user_id,
      }
    }

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

    if (activationToken.alreadyUsed) {
      await client.query("ROLLBACK")
      return {
        message: "Sua conta já havia sido ativada! Você pode fazer login.",
        user_id: activationToken.user_id,
      }
    }

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
          features = ARRAY['create:session', 'read:session', 'create:guest', 'read:guest', 'update:guest', 'update:guest:others', 'delete:guest', 'create:hotel', 'read:hotel', 'create:user', 'read:user', 'create:content', 'read:content', 'update:content', 'update:user', 'update:user:others', 'delete:content', 'delete:user', 'delete:user:others', 'read:user:others', 'create:company', 'read:company', 'update:company', 'delete:company'],
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

async function findValidToken(token, client) {
  const queryRunner = client || database
  const results = await queryRunner.query({
    text: `
      SELECT
      *
      FROM
        user_activation_tokens
      WHERE
        token = $1 
        AND expires_at > NOW()
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

  const activationToken = results.rows[0]

  if (activationToken.used_at !== null) {
    activationToken.alreadyUsed = true
  }

  return activationToken
}

async function findAllValidTokensByUserId(userId) {
  const results = await database.query({
    text: `
      SELECT
      *
      FROM
        user_activation_tokens
      WHERE
        user_id = $1 
        AND expires_at > NOW()
        AND used_at IS NULL
    `,
    values: [userId],
  })

  return results.rows
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
  findAllValidTokensByUserId,
  activateAdmAccount,
  isFirstActivation,
}

export default activation
