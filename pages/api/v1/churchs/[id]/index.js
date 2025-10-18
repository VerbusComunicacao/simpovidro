import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import church from "models/church.js"
import session from "models/session.js"

const router = createRouter()

router.get(getHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  const sessionToken = request.cookies.session_id
  await session.findOneValidByToken(sessionToken)

  const churchResponse = await church.getById(request.query.id)
  response.status(200).json(churchResponse)
}
