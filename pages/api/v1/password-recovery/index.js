import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import passwordRecovery from "models/password-recovery.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)

router.post(controller.canRequest("read:recovery_token"), postHandler)

export default router.handler(controller.errorHandlers)

async function postHandler(request, response) {
  const { email } = request.body

  if (!email) {
    return response.status(400).json({
      message: "O campo 'email' é obrigatório.",
    })
  }

  // Gera token e envia e-mail (ou apenas ignora silenciosamente se o usuário não existir)
  console.log(`Solicitação de recuperação de senha para o e-mail: ${email}`)
  await passwordRecovery.createToken(email)
  console.log(`Processamento de recuperação finalizado para: ${email}`)

  // Sempre retornamos 202 para evitar enumeração de usuários
  return response.status(202).json({
    message:
      "Se o e-mail informado estiver cadastrado em nossa base, um link de recuperação será enviado.",
  })
}
