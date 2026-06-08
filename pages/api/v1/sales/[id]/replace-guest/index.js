import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import sale from "models/sale.js"
import authorization from "models/authorization.js"
import { ValidationError } from "infra/errors.js"
import { sendRegistrationEmail } from "models/email-notifications.js"

const router = createRouter()
router.use(controller.injectAnnonymousOrUser)
router.post(controller.canRequest("update:content"), postHandler)

export default router.handler(controller.errorHandlers)

async function postHandler(request, response) {
  const { id } = request.query
  const { old_guest_id, new_guest_id, send_email } = request.body

  if (!old_guest_id || !new_guest_id) {
    throw new ValidationError({
      message: "Os IDs dos hóspedes (atual e novo) são obrigatórios.",
      action: "Informe old_guest_id e new_guest_id no corpo da requisição.",
    })
  }

  const updatedSale = await sale.replaceGuest(id, old_guest_id, new_guest_id)

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
