import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import activation from "models/activation.js"

const router = createRouter()

router.patch(patchHandler)

export default router.handler(controller.errorHandlers)

async function patchHandler(request, response) {
  const token = request.query.token

  const activatedUser = await activation.activateAccount(token)

  response.status(200).json(activatedUser)
}
