import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import authorization from "models/authorization.js"
import roomCategory from "models/room-category.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.get(controller.canRequest("read:content"), getHandler)
router.post(controller.canRequest("create:content"), postHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  // Busca room categories do usuário (filtro no banco)
  const roomCategories = await roomCategory.findAll()

  // Aplica filtros de autorização
  const secureRoomCategories = authorization.filterOutput(
    request.context.user,
    "read:content",
    roomCategories,
  )

  response.status(200).json(secureRoomCategories)
}

async function postHandler(request, response) {
  const roomCategoryInputValues = request.body

  const roomCategoryCreated = await roomCategory.create(
    roomCategoryInputValues,
    request.context.user.id,
  )

  const secureRoomCategory = authorization.filterOutput(
    request.context.user,
    "create:content",
    roomCategoryCreated,
  )

  response.status(201).json(secureRoomCategory)
}
