import { createRouter } from "next-connect"
import controller from "infra/controller"
import sale from "models/sale"
import authorization from "models/authorization"
import { sendRegistrationEmail } from "models/email-notifications.js"

const router = createRouter()
router.use(controller.injectAnnonymousOrUser)
router.get(controller.canRequest("read:content"), getHandler)
router.delete(controller.canRequest("delete:content"), deleteHandler)
router.patch(controller.canRequest("update:content"), patchHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  const { id } = request.query
  const saleFound = await sale.findOneByIdWithDetails(id)

  const secureSale = authorization.filterOutput(
    request.context.user,
    "read:content",
    saleFound,
  )

  return response.status(200).json(secureSale)
}

async function deleteHandler(request, response) {
  const saleId = request.query.id
  const sendEmail = request.query.send_email === "true"

  await sale.cancel(saleId)

  if (sendEmail) {
    await sendRegistrationEmail(saleId, {
      isAlteration: true,
      user: request.context.user,
    })
  }

  return response.status(204).end()
}

async function patchHandler(request, response) {
  const saleId = request.query.id
  const { bed_preference, send_email } = request.body

  if (!bed_preference) {
    return response.status(400).json({
      message: "O campo 'bed_preference' é obrigatório.",
    })
  }

  const updatedSale = await sale.updateBedPreference(saleId, bed_preference)

  if (send_email) {
    await sendRegistrationEmail(saleId, {
      isAlteration: true,
      user: request.context.user,
    })
  }

  return response.status(200).json(updatedSale)
}
