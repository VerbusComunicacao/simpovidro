import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import { ValidationError } from "infra/errors.js"
import tournament from "models/tournament.js"

const router = createRouter()
router.use(controller.injectAnnonymousOrUser)
router.get(getHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  const user = request.context.user

  if (!user || !user.id) {
    throw new ValidationError({
      message: "Você precisa estar logado para acessar os dados padrão.",
      action: "Faça login e tente novamente.",
    })
  }

  const defaults = await tournament.getDefaults(user.id)
  return response.status(200).json(defaults || {})
}
