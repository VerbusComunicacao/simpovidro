import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: process.env.EMAIL_SMTP_PORT,
  auth: {
    user: process.env.EMAIL_SMTP_USER,
    pass: process.env.EMAIL_SMTP_PASSWORD,
  },
  secure: process.env.EMAIL_SMTP_SECURE === "true",
})

async function send(mailOptions) {
  try {
    console.log(
      `[EMAIL] Tentando enviar: "${mailOptions.subject}" para ${mailOptions.to}`,
    )
    const info = await transporter.sendMail(mailOptions)
    console.log(`[EMAIL] Sucesso! ID: ${info.messageId}`)
    return info
  } catch (error) {
    console.error(`[EMAIL] Erro ao enviar para ${mailOptions.to}:`)
    console.error(`  - Mensagem: ${error.message}`)
    console.error(`  - Código: ${error.code}`)
    if (error.response)
      console.error(`  - Resposta do Servidor: ${error.response}`)
    if (error.command) console.error(`  - Comando SMTP: ${error.command}`)

    throw error
  }
}

const email = {
  send,
}

export default email
