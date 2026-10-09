import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import flightTransfer from "models/flight-transfer.js"
import { UnauthorizedError } from "infra/errors.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.get(getHandler)
router.delete(deleteHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  const user = request.context.user
  const { id } = request.query

  if (!user.id) {
    throw new UnauthorizedError({
      message: "Você precisa estar logado para consultar o registro de voo.",
      action: "Faça login e tente novamente.",
    })
  }

  const transfer = await flightTransfer.findById(id)
  return response.status(200).json(transfer)
}

async function deleteHandler(request, response) {
  const user = request.context.user
  const { id } = request.query

  if (!user.id) {
    throw new UnauthorizedError({
      message: "Você precisa estar logado para excluir este registro.",
      action: "Faça login e tente novamente.",
    })
  }

  const deletedTransfer = await flightTransfer.deleteById(
    id,
    user.id,
    user.features || [],
  )
  return response.status(200).json(deletedTransfer)
}
