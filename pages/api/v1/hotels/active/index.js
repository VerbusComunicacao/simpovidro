import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import hotel from "models/hotel.js"
import discount from "models/discount.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.get(controller.canRequest("read:public-content"), getHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(req, res) {
  const hotels = await hotel.getAllActiveHotels()
  const discounts = await discount.getAllActiveDiscounts()
  res.status(200).json({ hotels, discounts })
}
