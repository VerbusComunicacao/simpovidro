import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import sale from "models/sale.js"
import authorization from "models/authorization.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.get(controller.canRequest("read:content"), getHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  const { id } = request.query

  const saleFound = await sale.findOneByIdWithDetails(id)

  const secureSale = authorization.filterOutput(
    request.context.user,
    "read:content",
    saleFound,
  )

  response.status(200).json(secureSale)
}
