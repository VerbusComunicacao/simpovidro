import { createRouter } from "next-connect"
import controller from "infra/controller"
import { ForbiddenError } from "infra/errors"
import saleInstallment from "models/sale-installment"

const router = createRouter()
router.use(controller.injectAnnonymousOrUser)
router.get(getHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  const user = request.context.user

  if (!user.features?.includes("read:content")) {
    throw new ForbiddenError({
      message: "Você não tem permissão para acessar esta área.",
      action: "Entre em contato com o administrador.",
    })
  }

  const { sale_id, status } = request.query

  const installments = await saleInstallment.findAll({ sale_id, status })

  return response.status(200).json(installments)
}
