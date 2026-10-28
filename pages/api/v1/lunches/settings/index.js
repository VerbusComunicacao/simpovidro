import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import lunch from "models/lunch.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.get(getHandler)
router.patch(patchHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  const { hotel_id } = request.query || {}
  const settings = await lunch.getSettings(hotel_id)
  return response.status(200).json(settings)
}

async function patchHandler(request, response) {
  const user = request.context.user
  const userRoleCheck =
    user?.features?.includes("update:content") ||
    user?.features?.includes("create:hotel") ||
    user?.features?.includes("create:content") ||
    user?.features?.includes("read:sale:others") ||
    user?.features?.includes("admin")

  if (!userRoleCheck) {
    return response.status(403).json({
      message:
        "Você não possui permissão para alterar as configurações de almoço.",
      action: "Verifique suas credenciais de acesso.",
    })
  }

  const hotelId = request.body?.hotel_id || request.query?.hotel_id || null
  const updated = await lunch.updateSettings(hotelId, request.body)
  return response.status(200).json(updated)
}
