import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import lunch from "models/lunch.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.get(getHandler)
router.post(postHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  const { hotel_id, include_inactive } = request.query || {}
  const lunches = await lunch.findAllByHotelId(hotel_id, {
    includeInactive: include_inactive === "true" || include_inactive === true,
  })
  return response.status(200).json(lunches)
}

async function postHandler(request, response) {
  const user = request.context.user
  const userRoleCheck =
    user?.features?.includes("create:content") ||
    user?.features?.includes("create:hotel") ||
    user?.features?.includes("admin")

  if (!userRoleCheck) {
    return response.status(403).json({
      message: "Você não possui permissão para cadastrar novas mesas.",
      action: "Verifique suas credenciais de acesso.",
    })
  }

  const created = await lunch.create(request.body)
  return response.status(201).json(created)
}
