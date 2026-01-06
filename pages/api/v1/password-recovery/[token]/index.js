import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import passwordRecovery from "models/password-recovery.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)

router.patch(controller.canRequest("read:recovery_token"), patchHandler)

export default router.handler(controller.errorHandlers)

async function patchHandler(request, response) {
  const token = request.query.token
  const { password } = request.body

  if (!password) {
    return response.status(400).json({
      message: "O campo 'password' é obrigatório.",
    })
  }

  await passwordRecovery.resetPassword(token, password)

  return response.status(200).json({
    message: "Senha alterada com sucesso.",
  })
}
