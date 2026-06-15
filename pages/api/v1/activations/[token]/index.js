import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import activation from "models/activation.js"
import user from "models/user.js"

const router = createRouter()

router.patch(patchHandler)

export default router.handler(controller.errorHandlers)

async function patchHandler(request, response) {
  const token = request.query.token
  const lang = request.query.lang

  const isFirst = await activation.isFirstActivation()

  let activatedUser

  if (isFirst) {
    activatedUser = await activation.activateAdmAccount(token, lang)
  } else {
    activatedUser = await activation.activateAccount(token, lang)
  }

  await user.syncGuestId(activatedUser.user_id)

  response.status(200).json(activatedUser)
}
