import { createRouter } from "next-connect"
import controller from "infra/controller"
import company from "models/company"

const router = createRouter()
router.use(controller.injectAnnonymousOrUser)
router.use(controller.canRequest("read:content"))

router.patch(patchHandler)

export default router.handler(controller.errorHandlers)

async function patchHandler(request, response) {
  const { id } = request.query
  const updatedCompany = await company.update(id, request.body)
  return response.status(200).json(updatedCompany)
}
