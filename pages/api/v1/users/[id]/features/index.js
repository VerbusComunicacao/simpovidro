import { createRouter } from "next-connect"
import controller from "infra/controller"
import user from "models/user.js"

const router = createRouter()

router.patch(patchHandler)

export default router.handler(controller.errorHandlers)

async function patchHandler(request, response) {
  const { username } = request.query
  const { features } = request.body

  const userFound = await user.findOneByUsername(username)
  await user.setFeatures(userFound.id, features)
  const updatedUser = await user.findOneByUsername(username)

  response.status(200).json(updatedUser)
}
