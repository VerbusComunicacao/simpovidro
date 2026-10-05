import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import sale from "models/sale.js"
import authorization from "models/authorization.js"
import { sendRegistrationEmail } from "models/email-notifications.js"

const router = createRouter()
router.use(controller.injectAnnonymousOrUser)
router.patch(controller.canRequest("update:content"), patchHandler)

export default router.handler(controller.errorHandlers)

async function patchHandler(request, response) {
  const { id } = request.query
  const { new_value, send_email } = request.body

  const updatedSale = await sale.adjustPrice(id, new_value)

  if (send_email === true) {
    await sendRegistrationEmail(id, {
      isAlteration: true,
      user: request.context.user,
    })
  }

  const secureSale = authorization.filterOutput(
    request.context.user,
    "read:content",
    updatedSale,
  )

  return response.status(200).json(secureSale)
}
