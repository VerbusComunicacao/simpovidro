import { createRouter } from "next-connect"
import controller from "infra/controller"
import company from "models/company"

const router = createRouter()
router.use(controller.injectAnnonymousOrUser)

router.patch(controller.canRequest("update:company"), patchHandler)
router.delete(controller.canRequest("delete:company"), deleteHandler)

export default router.handler(controller.errorHandlers)

async function patchHandler(request, response) {
  const { id } = request.query
  const updatedCompany = await company.update(id, request.body)
  return response.status(200).json(updatedCompany)
}

async function deleteHandler(request, response) {
  const { id } = request.query
  await company.findOneById(id)
  await company.deleteById(id)
  return response.status(204).end()
}
