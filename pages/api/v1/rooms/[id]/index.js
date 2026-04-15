import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import authorization from "models/authorization.js"
import room from "models/room.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.get(controller.canRequest("read:content"), getHandler)
router.patch(controller.canRequest("update:content"), patchHandler)
router.delete(controller.canRequest("delete:content"), deleteHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  const { id } = request.query

  // Busca quarto (unificado)
  const roomFound = await room.findOneById(id)

  // Aplica filtros de autorização
  const secureRoom = authorization.filterOutput(
    request.context.user,
    "read:content",
    roomFound,
  )

  response.status(200).json(secureRoom)
}

async function patchHandler(request, response) {
  const { id } = request.query
  const roomInputValues = request.body

  const roomUpdated = await room.update(
    id,
    roomInputValues,
    request.context.user.id,
  )

  const secureRoomUpdated = authorization.filterOutput(
    request.context.user,
    "update:content",
    roomUpdated,
  )

  response.status(200).json(secureRoomUpdated)
}

async function deleteHandler(request, response) {
  const { id } = request.query
  const roomFounded = await room.findOneById(id)

  if (!authorization.can(request.context.user, "delete:content", roomFounded)) {
    return response.status(403).json({
      name: "ForbiddenError",
      message: "Você não possui permissão para executar esta ação.",
      action: "Verifique se você possui permissão para executar esta ação.",
      status_code: 403,
    })
  }

  await room.deleteById(id, request.context.user.id)

  response.status(204).end()
}
