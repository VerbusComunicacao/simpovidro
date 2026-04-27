import { createRouter } from "next-connect"
import controller from "infra/controller"
import company from "models/company"

const router = createRouter()
router.use(controller.injectAnnonymousOrUser)
router.get(getHandler)
router.post(postHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  if (request.query.cnpj) {
    const cleanCnpj = request.query.cnpj.replace(/\D/g, "")
    try {
      const foundCompany = await company.findOneByCnpj(cleanCnpj)
      return response.status(200).json(foundCompany)
    } catch (error) {
      if (error.name === "NotFoundError") {
        return response.status(404).json({
          message: error.message,
          action: error.action,
        })
      }
      throw error
    }
  }

  // Se não for busca por CNPJ, exige permissão de leitura admin
  await controller.canRequest("read:company")(request, response, async () => {
    const companies = await company.findAll()
    return response.status(200).json(companies)
  })
}

async function postHandler(request, response) {
  const user = request.context.user
  const companyData = { ...request.body }

  // Se o usuário não tiver permissão para configurar desconto, limpamos os campos
  if (!user.features.includes("create:company")) {
    companyData.discount_id = null
    companyData.custom_discount_percentage = null
  }

  const newCompany = await company.create(companyData)
  return response.status(201).json(newCompany)
}
