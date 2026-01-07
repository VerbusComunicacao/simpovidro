import { createRouter } from "next-connect"
import controller from "infra/controller"
import { ValidationError } from "infra/errors"
import guest from "models/guest"
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
      action: "Faça login e tente novamente."
    })
  }

  // 1. Find Guest Profile
  const userGuest = await guest.findOneByUserId(user.id)
  
  if (!userGuest) {
    // If no guest profile, user definitely has no orders yet (created via guest profile)
    return response.status(200).json([])
  }

  // 2. Find Sales
  const sales = await sale.findAllByGuestId(userGuest.id)

  return response.status(200).json(sales)
}
