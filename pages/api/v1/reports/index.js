import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import { ValidationError } from "infra/errors.js"
import report from "models/report.js"

const router = createRouter()
router.use(controller.injectAnnonymousOrUser)
router.get(getHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  const user = request.context.user

  if (!user.id) {
    throw new ValidationError({
      message: "Você precisa estar logado para acessar os relatórios.",
      action: "Faça login e tente novamente.",
    })
  }

  if (!user.features?.includes("read:sale:others")) {
    throw new ValidationError({
      message: "Você não tem permissão para acessar relatórios.",
      action: "Entre em contato com o administrador.",
    })
  }

  const { type, hotel_id } = request.query

  if (!hotel_id) {
    throw new ValidationError({
      message: "É obrigatório selecionar um hotel.",
      action: "Selecione um hotel e tente novamente.",
    })
  }

  let reportData

  switch (type) {
    case "complete":
      reportData = await report.generateCompleteReport(hotel_id)
      break
    case "by-company":
      reportData = await report.generateByCompany(hotel_id)
      break
    case "by-age":
      reportData = await report.generateByAge(hotel_id)
      break
    case "by-country":
      reportData = await report.generateByCountry(hotel_id)
      break
    case "by-uf":
      reportData = await report.generateByUF(hotel_id)
      break
    case "companies-by-activity":
      reportData = await report.generateCompaniesByActivityReport(hotel_id)
      break
    case "checkout-questions":
      reportData = await report.generateCheckoutQuestionsReport(hotel_id)
      break
    case "companies-discount":
      reportData = await report.generateCompaniesDiscountReport(hotel_id)
      break
    default:
      throw new ValidationError({
        message: "Tipo de relatório inválido.",
        action: "Escolha um tipo de relatório válido.",
      })
  }

  return response.status(200).json(reportData)
}
