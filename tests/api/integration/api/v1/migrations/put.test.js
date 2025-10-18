import orchestrator from "tests/orchestrator.js"

async function clearDatabase() {
  await orchestrator.clearDatabase()
}

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await clearDatabase()
})

describe("PUT /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Retrieving pending migrations", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        method: "PUT",
      })

      expect(response.status).toEqual(405)

      const responseBody = await response.json()

      expect(responseBody).toEqual({
        name: "MethodNotAllowedError",
        message: "Método não permitido para este endpoint.",
        action:
          "Verifique se o método HTTP enviado é válido para este endpoint.",
        status_code: 405,
      })
    })
  })
})
