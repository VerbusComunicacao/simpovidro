import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import lunch from "models/lunch.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.get(getHandler)
router.patch(patchHandler)
router.delete(deleteHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  const { id } = request.query
  const found = await lunch.findById(id)
  return response.status(200).json(found)
}

async function patchHandler(request, response) {
  const user = request.context.user
  const userRoleCheck =
    user?.features?.includes("update:content") ||
    user?.features?.includes("create:hotel") ||
    user?.features?.includes("admin")

  if (!userRoleCheck) {
    return response.status(403).json({
      message: "Você não possui permissão para editar mesas de almoço.",
      action: "Verifique suas credenciais de acesso.",
    })
  }

  const { id } = request.query
  const updated = await lunch.update(id, request.body)
  return response.status(200).json(updated)
}

async function deleteHandler(request, response) {
  const user = request.context.user
  const userRoleCheck =
    user?.features?.includes("delete:content") ||
    user?.features?.includes("create:hotel") ||
    user?.features?.includes("admin")

  if (!userRoleCheck) {
    return response.status(403).json({
      message: "Você não possui permissão para excluir mesas de almoço.",
      action: "Verifique suas credenciais de acesso.",
    })
  }

  const { id } = request.query
  await lunch.deleteById(id)
  return response.status(204).end()
}
