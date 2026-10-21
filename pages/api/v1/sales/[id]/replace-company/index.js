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
  const { new_company_id, send_email } = request.body

  if (!new_company_id) {
    throw new ValidationError({
      message: "O ID da nova empresa é obrigatório.",
      action: "Informe new_company_id no corpo da requisição.",
    })
  }

  const updatedSale = await sale.replaceCompany(id, new_company_id)

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
