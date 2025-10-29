import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import authorization from "models/authorization.js"
import room from "models/room.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.get(controller.canRequest("read:content"), getHandler)
router.post(controller.canRequest("create:content"), postHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  // Busca rooms do usuário (filtro no banco)
  const rooms = await room.findAllByUserId(request.context.user.id)

  // Aplica filtros de autorização
  const secureRooms = authorization.filterOutput(
    request.context.user,
    "read:content",
    rooms,
  )

  response.status(200).json(secureRooms)
}

async function postHandler(request, response) {
  const roomInputValues = request.body

  const roomCreated = await room.create(
    roomInputValues,
    request.context.user.id,
  )

  response.status(201).json(roomCreated)
}
