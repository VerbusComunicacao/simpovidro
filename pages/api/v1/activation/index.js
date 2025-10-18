import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import activation from "models/activation.js"

const router = createRouter()

router.post(postHandler)

export default router.handler(controller.errorHandlers)

async function postHandler(request, response) {
  const { token } = request.body

  if (!token) {
    return response.status(400).json({
      message: "Token é obrigatório",
      action: "Forneça um token válido para ativar a conta",
    })
  }

  const activatedUser = await activation.activateAccount(token)

  response.status(200).json({
    message: "Conta ativada com sucesso!",
    user: activatedUser,
  })
}
