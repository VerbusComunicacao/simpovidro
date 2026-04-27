import { createRouter } from "next-connect"
import controller from "infra/controller"
import company from "models/company"
import discount from "models/discount"

const router = createRouter()
router.use(controller.injectAnnonymousOrUser)
router.post(controller.canRequest("create:company"), postHandler)
router.delete(controller.canRequest("delete:company"), deleteHandler)

export default router.handler(controller.errorHandlers)

async function postHandler(request, response) {
  const companiesToCreate = request.body

  if (!Array.isArray(companiesToCreate)) {
    return response.status(400).json({
      message: "O corpo da requisição deve ser um array de empresas.",
      action: "Envie um array e tente novamente.",
    })
  }

  const results = {
    successCount: 0,
    errorCount: 0,
    errors: [],
  }

  for (let i = 0; i < companiesToCreate.length; i++) {
    const companyData = { ...companiesToCreate[i] }
    const discountName = companyData.discount_name

    try {
      if (discountName) {
        const foundDiscount = await discount.findOneByName(discountName)
        companyData.discount_id = foundDiscount.id
      }
      delete companyData.discount_name // Remove from object to avoid postgres error

      await company.create(companyData, { isImport: true })
      results.successCount++
    } catch (error) {
      // Log para debug
      console.error(`Erro na linha ${i + 1}:`, error.cause || error)

      results.errorCount++
      results.errors.push({
        row: i + 1,
        corporate_name: companyData.corporate_name || "N/A",
        message: error.message,
        action: error.action,
      })
    }
  }

  return response.status(200).json(results)
}

async function deleteHandler(request, response) {
  await company.deleteAll()
  return response.status(204).end()
}
