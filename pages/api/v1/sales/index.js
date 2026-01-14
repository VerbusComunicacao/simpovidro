import { createRouter } from "next-connect"
import controller from "infra/controller"
import { ValidationError } from "infra/errors"
import sale from "models/sale"

const router = createRouter()
router.use(controller.injectAnnonymousOrUser)
router.get(getHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  const user = request.context.user

  if (!user.id) {
    throw new ValidationError({
      message: "Você precisa estar logado para acessar os dados.",
      action: "Faça login e tente novamente.",
    })
  }

  if (!user.features?.includes("read:content")) {
    throw new ValidationError({
      message: "Você não tem permissão para acessar esta área.",
      action: "Entre em contato com o administrador.",
    })
  }

  const sales = await sale.findAll()

  return response.status(200).json(sales)
}
