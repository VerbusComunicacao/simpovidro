import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import { ValidationError } from "infra/errors.js"
import tournament from "models/tournament.js"

const router = createRouter()
router.use(controller.injectAnnonymousOrUser)
router.get(getHandler)
router.delete(deleteHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  const user = request.context.user

  if (!user || !user.id) {
    throw new ValidationError({
      message: "Você precisa estar logado para acessar a inscrição.",
      action: "Faça login e tente novamente.",
    })
  }

  const { id } = request.query
  const item = await tournament.findById(id)

  const isOwner = item.user_id === user.id
  const isAdmin =
    user.features?.includes("create:content") ||
    user.features?.includes("read:sale:others")

  if (!isOwner && !isAdmin) {
    throw new ValidationError({
      message: "Você não tem permissão para visualizar esta inscrição.",
      action: "Verifique suas permissões.",
    })
  }

  return response.status(200).json(item)
}

async function deleteHandler(request, response) {
  const user = request.context.user

  if (!user || !user.id) {
    throw new ValidationError({
      message: "Você precisa estar logado para excluir uma inscrição.",
      action: "Faça login e tente novamente.",
    })
  }

  const { id } = request.query
  const deletedItem = await tournament.deleteById(
    id,
    user.id,
    user.features || [],
  )

  return response.status(200).json(deletedItem)
}
