import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import discount from "models/discount.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)

router.get(getHandler)
router.patch(controller.canRequest("update:content"), patchHandler)
router.delete(controller.canRequest("delete:content"), deleteHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(req, res) {
  const discountFound = await discount.findOneById(req.query.id)
  return res.status(200).json(discountFound)
}

async function patchHandler(req, res) {
  const updatedDiscount = await discount.update(req.query.id, req.body)
  return res.status(200).json(updatedDiscount)
}

async function deleteHandler(req, res) {
  await discount.deleteById(req.query.id)
  return res.status(204).end()
}
