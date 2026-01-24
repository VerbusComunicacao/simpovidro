import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import discount from "models/discount.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)

router.get(getHandler)
router.post(controller.canRequest("create:content"), postHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(req, res) {
  const allDiscounts = await discount.findAll()
  return res.status(200).json(allDiscounts)
}

async function postHandler(req, res) {
  const newDiscount = await discount.create(req.body)
  return res.status(201).json(newDiscount)
}
