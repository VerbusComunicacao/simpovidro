import { createRouter } from "next-connect"
import controller from "infra/controller"
import user from "models/user.js"
import activation from "models/activation.js"
import authorization from "models/authorization.js"
import { ValidationError } from "infra/errors.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.post(controller.canRequest("create:user"), postHandler)
router.get(controller.canRequest("read:user:others"), getHandler)

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

async function getHandler(request, response) {
  const { email } = request.query

  if (!email) {
    throw new ValidationError({
      message: 'O parâmetro "email" é obrigatório.',
      action: "Informe o e-mail do usuário que deseja buscar.",
    })
  }

  const userFound = await user.findOneByEmail(email)

  const secureUserFound = authorization.filterOutput(
    request.context.user,
    "read:user",
    userFound,
  )

  response.status(200).json(secureUserFound)
}
