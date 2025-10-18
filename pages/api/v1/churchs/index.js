import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import church from "models/church.js"
import session from "models/session.js"

const router = createRouter()

router.post(postHandler)
router.get(getHandler)

export default router.handler(controller.errorHandlers)

async function postHandler(request, response) {
  const sessionToken = request.cookies.session_id
  const sessionObject = await session.findOneValidByToken(sessionToken)

  const userInputValues = request.body
  const newChurch = await church.create(userInputValues, sessionObject.user_id)
  response.status(201).json(newChurch)
}

async function getHandler(request, response) {
  const sessionToken = request.cookies.session_id
  const sessionObject = await session.findOneValidByToken(sessionToken)

  const page = request.query.page ?? undefined

  const churchs = await church.getAllByUserId(sessionObject.user_id, page)
  response.status(201).json(churchs)
}
