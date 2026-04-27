import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import session from "models/session.js"
import user from "models/user.js"
import authorization from "models/authorization.js"
import roomType from "models/room-type.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.get(controller.canRequest("read:content"), getHandler)
router.patch(controller.canRequest("update:content"), patchHandler)
router.delete(controller.canRequest("delete:content"), deleteHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  const sessionToken = request.cookies.session_id
  const sessionObject = await session.findOneValidByToken(sessionToken)

  const userFound = await user.findOneById(sessionObject.user_id)

  const { id } = request.query

  // Busca room type (consulta global)
  const roomTypeFound = await roomType.findOneById(id)

  // Aplica filtros de autorização
  const secureRoomType = authorization.filterOutput(
    userFound,
    "read:content",
    roomTypeFound,
  )

  response.status(200).json(secureRoomType)
}

async function patchHandler(request, response) {
  const sessionToken = request.cookies.session_id
  const sessionObject = await session.findOneValidByToken(sessionToken)

  const userFound = await user.findOneById(sessionObject.user_id)

  if (!authorization.can(userFound, "update:content")) {
    return response.status(403).json({
      name: "ForbiddenError",
      message: "Você não possui permissão para executar esta ação.",
      action: "Verifique se você possui permissão para executar esta ação.",
      status_code: 403,
    })
  }

  const { id } = request.query
  const roomTypeInputValues = request.body

  const roomTypeUpdated = await roomType.update(
    id,
    roomTypeInputValues,
    sessionObject.user_id,
  )

  response.status(200).json(roomTypeUpdated)
}

async function deleteHandler(request, response) {
  const sessionToken = request.cookies.session_id
  const sessionObject = await session.findOneValidByToken(sessionToken)

  const userFound = await user.findOneById(sessionObject.user_id)

  const { id } = request.query
  const roomTypeFounded = await roomType.findOneById(id)

  if (!authorization.can(userFound, "delete:content", roomTypeFounded)) {
    return response.status(403).json({
      name: "ForbiddenError",
      message: "Você não possui permissão para executar esta ação.",
      action: "Verifique se você possui permissão para executar esta ação.",
      status_code: 403,
    })
  }

  await roomType.deleteById(id, sessionObject.user_id)

  response.status(204).end()
}
