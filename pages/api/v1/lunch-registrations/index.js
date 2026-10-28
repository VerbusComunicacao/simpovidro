import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import lunchRegistration from "models/lunch-registration.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.get(getHandler)
router.post(postHandler)
router.delete(deleteHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  const { hotel_id, lunch_id } = request.query || {}
  const list = await lunchRegistration.listByHotel(hotel_id, lunch_id)
  return response.status(200).json(list)
}

async function postHandler(request, response) {
  const { guest_id, sale_id, lunch_id, lunch_ids } = request.body || {}
  const result = await lunchRegistration.registerOrUpdate({
    guest_id,
    sale_id,
    lunch_id,
    lunch_ids,
  })
  return response.status(201).json(result)
}

async function deleteHandler(request, response) {
  const { guest_id, lunch_id } = request.query || request.body || {}
  if (guest_id && lunch_id) {
    const result = await lunchRegistration.deleteByGuestAndLunch(
      guest_id,
      lunch_id,
    )
    return response.status(200).json(result)
  }
  if (guest_id) {
    const result = await lunchRegistration.deleteByGuestId(guest_id)
    return response.status(200).json(result)
  }
  return response.status(400).json({
    message: "Identificador do participante (guest_id) é obrigatório.",
  })
}
