import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import guest from "models/guest.js"
import database from "infra/database.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.post(controller.canRequest("create:guest"), postHandler)

export default router.handler(controller.errorHandlers)

async function postHandler(request, response) {
  const { guests_data } = request.body

  if (!Array.isArray(guests_data) || guests_data.length === 0) {
    return response.status(400).json({
      message: "Nenhum dado fornecido para importação.",
      action: "Envie um arquivo CSV com pelo menos uma linha de dados.",
    })
  }

  const results = {
    success: 0,
    errors: [],
  }

  const client = await database.getNewClient()
  try {
    await client.query("BEGIN")

    for (let i = 0; i < guests_data.length; i++) {
      const guestData = guests_data[i]
      try {
        await client.query(`SAVEPOINT guest_${i}`)
        await guest.upsert(guestData, request.context.user.id, client, true)
        results.success++
      } catch (error) {
        await client.query(`ROLLBACK TO SAVEPOINT guest_${i}`)
        results.errors.push({
          row: i + 2, // Considerando que a linha 1 do CSV é o cabeçalho
          name: guestData.name || "Desconhecido",
          message: error.message || "Erro desconhecido ao importar.",
        })
      }
    }

    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    await client.end()
  }

  response.status(200).json(results)
}
