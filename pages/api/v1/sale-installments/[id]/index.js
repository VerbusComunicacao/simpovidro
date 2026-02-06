import { createRouter } from "next-connect"
import controller from "infra/controller"
import { ForbiddenError } from "infra/errors"
import saleInstallment from "models/sale-installment"

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

  return response.status(200).json(updatedInstallment)
}
