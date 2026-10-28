import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import lunchRegistration from "models/lunch-registration.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.delete(deleteHandler)

export default router.handler(controller.errorHandlers)

async function deleteHandler(request, response) {
  const { id } = request.query || {}
  const deleted = await lunchRegistration.deleteById(id)
  return response.status(200).json(deleted)
}
