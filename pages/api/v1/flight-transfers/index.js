import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import flightTransfer from "models/flight-transfer.js"
import { UnauthorizedError } from "infra/errors.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.get(getHandler)
router.post(postHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  const user = request.context.user

  if (!user.id) {
    throw new UnauthorizedError({
      message: "Você precisa estar logado para visualizar seus voos.",
      action: "Faça login e tente novamente.",
    })
  }

  const userTransfers = await flightTransfer.findByUserId(user.id)
  return response.status(200).json(userTransfers)
}

async function postHandler(request, response) {
  const user = request.context.user

  if (!user.id) {
    throw new UnauthorizedError({
      message: "Você precisa estar logado para cadastrar informações de voo.",
      action: "Faça login e tente novamente.",
    })
  }

  const createdTransfer = await flightTransfer.create(request.body, user.id)
  return response.status(201).json(createdTransfer)
}
