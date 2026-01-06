import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import activation from "models/activation.js"
import session from "models/session.js"

const router = createRouter()

router.patch(patchHandler)

export default router.handler(controller.errorHandlers)

async function patchHandler(request, response) {
  const token = request.query.token

  const isFirst = await activation.isFirstActivation()

  let activatedTokenRow

  if (isFirst) {
    activatedTokenRow = await activation.activateAdmAccount(token)
  } else {
    activatedTokenRow = await activation.activateAccount(token)
  }

  const sessionObject = await session.create(activatedTokenRow.user_id)
  await controller.setSessionCookie(sessionObject.token, response)

  response.status(200).json(activatedTokenRow)
}
