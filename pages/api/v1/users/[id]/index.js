import { createRouter } from "next-connect"
import controller from "infra/controller"
import { ForbiddenError } from "infra/errors.js"
const router = createRouter()
import user from "models/user.js"
import authorization from "models/authorization.js"

router.use(controller.injectAnnonymousOrUser)
router.get(getHandler)
router.patch(patchHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  const { id } = await request.query
  const userFound = await user.findOneById(id)

  if (!authorization.can(request.context.user, "read:user", userFound)) {
    throw new ForbiddenError({
      message: "Você não possui permissão para ler as informações deste usuário.",
      action: "Verifique se você possui permissão para executar esta ação.",
    })
  }

  const secureUserFound = authorization.filterOutput(
    request.context.user,
    "read:user",
    userFound,
  )
  response.status(200).json(secureUserFound)
}

async function patchHandler(request, response) {
  const { id } = await request.query
  const userInputNewValues = request.body

  const userToUpdate = await user.findOneById(id)

  if (!authorization.can(request.context.user, "update:user", userToUpdate)) {
    throw new ForbiddenError({
      message: "Você não possui permissão para atualizar as informações deste usuário.",
      action: "Verifique se você possui permissão para executar esta ação.",
    })
  }

  const updatedUser = await user.update(id, userInputNewValues)

  const secureUpdatedUser = authorization.filterOutput(
    request.context.user,
    "update:user",
    updatedUser,
  )
  response.status(200).json(secureUpdatedUser)
}
