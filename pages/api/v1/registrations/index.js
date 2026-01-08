import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import guest from "models/guest.js"
import sale from "models/sale.js"
import { ValidationError } from "infra/errors.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.post(postHandler)

export default router.handler(controller.errorHandlers)

async function postHandler(request, response) {
  const user = request.context.user
  const { 
    room_id, 
    guest_data 
  } = request.body

  if (!user.id) {
    throw new ValidationError({
      message: "Você precisa estar logado para realizar a inscrição.",
      action: "Faça login e tente novamente."
    })
  }

  // 1. Upsert Guest (Find existing by User ID, update it, or create new)
  let userGuest = await guest.findOneByUserId(user.id)
  let savedGuest

  if (userGuest) {
    savedGuest = await guest.update(userGuest.id, guest_data)
  } else {
    savedGuest = await guest.create(guest_data, user.id)
  }

  // 2. Create Sale (Transactions handling: Validate room, Check availability, Create Sale, Update Room Availability)
  const newSale = await sale.create({
    guest_id: savedGuest.id,
    room_id: room_id,
  })

  return response.status(201).json({
    saleId: newSale.id,
    guestId: savedGuest.id
  })
}
