import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import session from "models/session.js"
import user from "models/user.js"
import authorization from "models/authorization.js"
import hotel from "models/hotel.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.get(controller.canRequest("read:content"), getHandler)
router.post(controller.canRequest("create:content"), postHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  // Busca todos os hotéis (sistema unificado)
  const hotels = await hotel.findAll()

  // Aplica filtros de autorização
  const secureHotels = authorization.filterOutput(
    request.context.user,
    "read:content",
    hotels,
  )

  response.status(200).json(secureHotels)
}

async function postHandler(request, response) {
  const sessionToken = request.cookies.session_id
  const sessionObject = await session.findOneValidByToken(sessionToken)

  const userFound = await user.findOneById(sessionObject.user_id)

  if (!authorization.can(userFound, "create:content")) {
    return response.status(403).json({
      name: "ForbiddenError",
      message: "Você não possui permissão para executar esta ação.",
      action: "Verifique se você possui permissão para executar esta ação.",
      status_code: 403,
    })
  }

  const hotelInputValues = request.body

  const hotelCreated = await hotel.create(
    hotelInputValues,
    sessionObject.user_id,
  )

  response.status(201).json(hotelCreated)
}
