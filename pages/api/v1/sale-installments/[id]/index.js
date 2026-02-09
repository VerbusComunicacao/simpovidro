import { createRouter } from "next-connect"
import controller from "infra/controller"
import { ForbiddenError } from "infra/errors"
import saleInstallment from "models/sale-installment"
import sale from "models/sale"

const router = createRouter()
router.use(controller.injectAnnonymousOrUser)
router.patch(patchHandler)

export default router.handler(controller.errorHandlers)

async function patchHandler(request, response) {
  const user = request.context.user

  if (!user.features?.includes("update:content")) {
    throw new ForbiddenError({
      message: "Você não tem permissão para atualizar parcelas.",
      action: "Entre em contato com o administrador.",
    })
  }

  const installmentId = request.query.id
  const updatedInstallment = await saleInstallment.update(
    installmentId,
    request.body,
  )

  // Auto-update sale status if all installments are paid
  if (updatedInstallment && updatedInstallment.sale_id) {
    const allInstallments = await saleInstallment.findAll({
      sale_id: updatedInstallment.sale_id,
    })

    const allPaid = allInstallments.every((i) => i.status === "paid")

    if (allPaid) {
      await sale.update(updatedInstallment.sale_id, {
        status: "confirmed",
        payment_status: "paid",
      })
    } else {
      // Logic to revert status if it was previously paid could be added here
      // But for now sticking to the plan: only marking as paid.
      // E.g. if someone manually unmarks a payment, the sale status remains 'confirmed' unless logic is added.
      // For MVP, marking as 'confirmed' is the priority.
      const anyPaid = allInstallments.some((i) => i.status === "paid")
      const newPaymentStatus = anyPaid ? "partial" : "pending"

      // Ideally we should check current status before updating to avoid redundant updates
      // but sale.update handles basic updates.
      // We'll update the payment_status to reflect current state.
      // NOTE: We don't revert 'confirmed' status back to 'pending' automatically for now as 'confirmed' might mean other things.
      // We only update payment_status.
      await sale.update(updatedInstallment.sale_id, {
        payment_status: newPaymentStatus,
      })
    }
  }

  return response.status(200).json(updatedInstallment)
}
