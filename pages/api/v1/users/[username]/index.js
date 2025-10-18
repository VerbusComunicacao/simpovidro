import { createRouter } from "next-connect"
import controller from "infra/controller"
const router = createRouter()
import user from "models/user.js"

router.get(getHandler)
router.patch(patchHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  const { username } = await request.query
  const userFound = await user.findOneByUsername(username)
  response.status(200).json(userFound)
}

async function patchHandler(request, response) {
  const { username } = await request.query
  const userInputNewValues = request.body
  const updatedUser = await user.update(username, userInputNewValues)
  response.status(200).json(updatedUser)
}
