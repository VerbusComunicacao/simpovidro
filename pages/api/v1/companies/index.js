import { createRouter } from "next-connect"
import controller from "infra/controller"
import company from "models/company"

const router = createRouter()
router.use(controller.injectAnnonymousOrUser)
router.use(controller.canRequest("read:content"))

router.get(getHandler)
router.post(postHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  const companies = await company.findAll()
  return response.status(200).json(companies)
}

async function postHandler(request, response) {
  const newCompany = await company.create(request.body)
  return response.status(201).json(newCompany)
}
