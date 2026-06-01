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
      message: "Você precisa estar logado para ver seus pedidos.",
      action: "Faça login e tente novamente.",
    })
  }

  // 1. Find Sales
  const sales = await sale.findAllByUserId(user.id)

  return response.status(200).json(sales)
}
