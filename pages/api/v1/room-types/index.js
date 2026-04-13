import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import authorization from "models/authorization.js"
import roomType from "models/room-type.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.get(controller.canRequest("read:content"), getHandler)
router.post(controller.canRequest("create:content"), postHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  const roomTypes = await roomType.findAll()

  // Aplica filtros de autorização
  const secureRoomTypes = authorization.filterOutput(
    request.context.user,
    "read:content",
    roomTypes,
  )

  response.status(200).json(secureRoomTypes)
}

async function postHandler(request, response) {
  const roomTypeInputValues = request.body

  const roomTypeCreated = await roomType.create(
    roomTypeInputValues,
    request.context.user.id,
  )

  response.status(201).json(roomTypeCreated)
}
