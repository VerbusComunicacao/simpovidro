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

  const emailHtml = `
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="width: 600px; max-width: 100%; font-family: sans-serif; color: #374151; line-height: 1.5; border-collapse: collapse; margin: 0 auto;">
        <!-- Header Image -->
        <tr>
          <td style="padding: 0; line-height: 0;">
            <img src="${webserver.origin}/images/banner-topo.png" alt="17º Simpovidro" width="600" style="width: 600px; max-width: 100%; height: auto; display: block; border-radius: 8px 8px 0 0; border: 1px solid #e5e7eb; border-bottom: none;">
          </td>
        </tr>

        <!-- Body Content -->
        <tr>
          <td style="padding: 20px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; background-color: #ffffff; text-align: left;">
            <p>Olá, <strong>${user.full_name}</strong>!</p>
            <p>Falta pouco para você completar sua inscrição no Simpovidro 2026. Clique no botão abaixo para ativar seu cadastro:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${activationLink}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Ativar minha conta</a>
            </div>

            <p style="font-size: 0.85em; color: #6b7280; text-align: center; margin-bottom: 30px;">
              Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:<br/>
              <a href="${activationLink}" style="color: #2563eb; word-break: break-all;">${activationLink}</a>
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
            <img src="${webserver.origin}/images/banner-rodape.png" alt="Patrocinadores e Realização" width="600" style="width: 600px; max-width: 100%; height: auto; display: block; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
          </td>
        </tr>
      </table>
    `

  await email.send({
    from: `Simpovidro <simpovidro@abravidro.org.br>`,
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
