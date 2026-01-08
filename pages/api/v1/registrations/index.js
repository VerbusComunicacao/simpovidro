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
    guests_data 
  } = request.body

  if (!user.id) {
    throw new ValidationError({
      message: "Você precisa estar logado para realizar a inscrição.",
      action: "Faça login e tente novamente."
    })
  }

  if (!Array.isArray(guests_data) || guests_data.length === 0) {
    throw new ValidationError({
      message: "É necessário informar pelo menos um hóspede.",
      action: "Adicione os dados do hóspede e tente novamente."
    })
  }

  // 1. Process all guests (Single Responsibility: Guest Identity management handled by guest.upsert)
  const savedGuestIds = []
  
  for (let i = 0; i < guests_data.length; i++) {
    const currentGuestData = guests_data[i]
    
    // First guest is associated with the logged-in user if it's a new record
    const guestUserId = i === 0 ? user.id : null
    
    const savedGuest = await guest.upsert(currentGuestData, guestUserId)
    savedGuestIds.push(savedGuest.id)
  }

  // 2. Create Sale (Transactions handling: Validate room, Check availability, Create Sale, Update Room Availability)
  const newSale = await sale.create({
    guest_ids: savedGuestIds,
    room_id: room_id,
  })

  return response.status(201).json({
    saleId: newSale.id,
    guestIds: savedGuestIds
  })
}
