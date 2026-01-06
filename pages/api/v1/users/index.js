import { createRouter } from "next-connect"
import controller from "infra/controller"
import user from "models/user.js"
import activation from "models/activation.js"
import authorization from "models/authorization.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.post(controller.canRequest("create:user"), postHandler)

export default router.handler(controller.errorHandlers)

async function postHandler(request, response) {
  const userInputValues = request.body
  const newUser = await user.create(userInputValues)
  const activationToken = await activation.generateToken(newUser.id)

  await activation.sendEmailToUser(newUser, activationToken)

  const secureUser = authorization.filterOutput(
    request.context.user,
    "create:user",
    newUser,
  )

  response.status(201).json(secureUser)
}
