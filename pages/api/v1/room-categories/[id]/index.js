import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import authorization from "models/authorization.js"
import roomCategory from "models/room-category.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.get(controller.canRequest("read:content"), getHandler)
router.patch(controller.canRequest("update:content"), patchHandler)
router.delete(controller.canRequest("delete:content"), deleteHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  const { id } = request.query

  // Busca room category com filtro de segurança (só room categories do usuário)
  const roomCategoryFound = await roomCategory.findOneByIdAndUserId(
    id,
    request.context.user.id,
  )

  // Aplica filtros de autorização
  const secureRoomCategory = authorization.filterOutput(
    request.context.user,
    "read:content",
    roomCategoryFound,
  )

  response.status(200).json(secureRoomCategory)
}

async function patchHandler(request, response) {
  const { id } = request.query
  const roomCategoryInputValues = request.body

  const roomCategoryUpdated = await roomCategory.update(
    id,
    roomCategoryInputValues,
    request.context.user.id,
  )

  const secureRoomCategoryUpdated = authorization.filterOutput(
    request.context.user,
    "update:content",
    roomCategoryUpdated,
  )

  response.status(200).json(secureRoomCategoryUpdated)
}

async function deleteHandler(request, response) {
  const { id } = request.query
  const roomCategoryFounded = await roomCategory.findOneById(id)

  if (
    !authorization.can(
      request.context.user,
      "delete:content",
      roomCategoryFounded,
    )
  ) {
    return response.status(403).json({
      name: "ForbiddenError",
      message: "Você não possui permissão para executar esta ação.",
      action: "Verifique se você possui permissão para executar esta ação.",
      status_code: 403,
    })
  }

  await roomCategory.deleteById(id, request.context.user.id)

  response.status(204).end()
}
