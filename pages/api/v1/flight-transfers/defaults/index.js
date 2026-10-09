import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import flightTransfer from "models/flight-transfer.js"
import { UnauthorizedError } from "infra/errors.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.get(getHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  const user = request.context.user

  if (!user.id) {
    throw new UnauthorizedError({
      message: "Você precisa estar logado para carregar dados padrão.",
      action: "Faça login e tente novamente.",
    })
  }

  const defaults = await flightTransfer.getUserDefaults(user.id)
  return response.status(200).json(defaults)
}
