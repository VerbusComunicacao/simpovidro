import { createRouter } from "next-connect"
import controller from "infra/controller"
import user from "models/user.js"
import authorization from "models/authorization.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.patch(controller.canRequest("update:user:others"), patchHandler)

export default router.handler(controller.errorHandlers)

async function patchHandler(request, response) {
  const { id } = request.query
  const { features } = request.body

  await user.setFeatures(id, features)
  const updatedUser = await user.findOneById(id)

  const secureUpdatedUser = authorization.filterOutput(
    request.context.user,
    "update:user",
    updatedUser,
  )

  response.status(200).json(secureUpdatedUser)
}
