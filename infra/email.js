import nodemailer from "nodemailer"

const primaryTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: process.env.EMAIL_SMTP_PORT,
  auth: {
    user: process.env.EMAIL_SMTP_USER,
    pass: process.env.EMAIL_SMTP_PASSWORD,
  },
  secure: process.env.EMAIL_SMTP_SECURE === "true",
})

// Cria o transportador de backup apenas se as variáveis estiverem configuradas
let fallbackTransporter = null
if (process.env.FALLBACK_EMAIL_SMTP_HOST) {
  fallbackTransporter = nodemailer.createTransport({
    host: process.env.FALLBACK_EMAIL_SMTP_HOST,
    port: process.env.FALLBACK_EMAIL_SMTP_PORT,
    auth: {
      user: process.env.FALLBACK_EMAIL_SMTP_USER,
      pass: process.env.FALLBACK_EMAIL_SMTP_PASSWORD,
    },
    secure: process.env.FALLBACK_EMAIL_SMTP_SECURE === "true",
  })
}

async function send(mailOptions) {
  const forceFallback = process.env.FORCE_FALLBACK_EMAIL === "true"

  if (forceFallback && fallbackTransporter) {
    try {
      console.warn(
        `[EMAIL] [FORÇADO] Ignorando provedor primário. Tentando Provedor de Backup (Fallback): "${mailOptions.subject}" para ${mailOptions.to}`,
      )
      const info = await fallbackTransporter.sendMail(mailOptions)
      console.log(
        `[EMAIL] [FORÇADO] Sucesso no Provedor de Backup! ID: ${info.messageId}`,
      )
      return info
    } catch (fallbackError) {
      console.error(
        `[EMAIL] [FORÇADO] Falha no provedor de backup forçado: ${fallbackError.message}`,
      )
      console.warn(
        `[EMAIL] Tentando Provedor Primário como última alternativa devido a erro no backup.`,
      )
    }
  }

  try {
    console.log(
      `[EMAIL] Tentando enviar: "${mailOptions.subject}" para ${mailOptions.to} (Provedor Primário)`,
    )
    const info = await primaryTransporter.sendMail(mailOptions)
    console.log(`[EMAIL] Sucesso no Provedor Primário! ID: ${info.messageId}`)
    return info
  } catch (primaryError) {
    console.error(
      `[EMAIL] Falha no Provedor Primário ao enviar para ${mailOptions.to}: ${primaryError.message}`,
    )

    if (fallbackTransporter) {
      try {
        console.warn(
          `[EMAIL] Tentando Provedor de Backup (Fallback) para enviar: "${mailOptions.subject}" para ${mailOptions.to}`,
        )
        const info = await fallbackTransporter.sendMail(mailOptions)
        console.log(
          `[EMAIL] Sucesso no Provedor de Backup (Fallback)! ID: ${info.messageId}`,
        )
        return info
      } catch (fallbackError) {
        console.error(
          `[EMAIL] Falha crítica: Ambos os provedores de e-mail falharam ao enviar para ${mailOptions.to}.`,
        )
        console.error(`  - Erro Primário: ${primaryError.message}`)
        console.error(`  - Erro Backup: ${fallbackError.message}`)
        throw fallbackError
      }
    }

    throw primaryError
  }
}

const email = {
  send,
}

export default email
