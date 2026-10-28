import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import lunchRegistration from "models/lunch-registration.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.post(postHandler)
router.get(getHandler)

export default router.handler(controller.errorHandlers)

async function postHandler(request, response) {
  const { document } = request.body || {}
  const result = await lunchRegistration.lookupParticipant(document)
  return response.status(200).json(result)
}

async function getHandler(request, response) {
  const { document } = request.query || {}
  const result = await lunchRegistration.lookupParticipant(document)
  return response.status(200).json(result)
}
