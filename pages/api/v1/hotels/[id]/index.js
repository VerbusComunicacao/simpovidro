import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import authorization from "models/authorization.js"
import hotel from "models/hotel.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.get(controller.canRequest("read:content"), getHandler)
router.patch(controller.canRequest("update:content"), patchHandler)
router.delete(controller.canRequest("delete:content"), deleteHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  const { id } = request.query

  // Busca hotel (acesso global unificado)
  const hotelFound = await hotel.findOneById(id)

  // Aplica filtros de autorização
  const secureHotel = authorization.filterOutput(
    request.context.user,
    "read:content",
    hotelFound,
  )

  response.status(200).json(secureHotel)
}

async function patchHandler(request, response) {
  const { id } = request.query
  const hotelInputValues = request.body

  const hotelUpdated = await hotel.update(
    id,
    hotelInputValues,
    request.context.user.id,
  )

  const secureHotelUpdated = authorization.filterOutput(
    request.context.user,
    "update:content",
    hotelUpdated,
  )

  response.status(200).json(secureHotelUpdated)
}

async function deleteHandler(request, response) {
  const { id } = request.query
  const hotelFounded = await hotel.findOneById(id)

  if (
    !authorization.can(request.context.user, "delete:content", hotelFounded)
  ) {
    return response.status(403).json({
      name: "ForbiddenError",
      message: "Você não possui permissão para executar esta ação.",
      action: "Verifique se você possui permissão para executar esta ação.",
      status_code: 403,
    })
  }

  await hotel.deleteById(id, request.context.user.id)

  response.status(204).end()
}
