import { createRouter } from "next-connect"
import controller from "infra/controller"
import company from "models/company"

const router = createRouter()
router.use(controller.injectAnnonymousOrUser)
router.post(postHandler)
router.delete(deleteHandler)

export default router.handler(controller.errorHandlers)

async function postHandler(request, response) {
  // Batch import should require admin permissions
  await controller.canRequest("create:company")(request, response, async () => {
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
      const companyData = companiesToCreate[i]
      try {
        await company.create(companyData)
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
  })
}

async function deleteHandler(request, response) {
  await controller.canRequest("delete:company")(request, response, async () => {
    await company.deleteAll()
    return response.status(204).end()
  })
}
