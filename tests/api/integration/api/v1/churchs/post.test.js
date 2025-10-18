import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("POST /api/v1/churchs", () => {
  describe("Authenticated common user", () => {
    test("With unique and valid data", async () => {
      const createdUser = await orchestrator.createUser()
      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch("http://localhost:3000/api/v1/churchs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          name: "Igreja Batista Catuaí",
          cnpj: "12.345.678/0001-90",
          address: "Rua das Flores, 123 - Centro",
        }),
      })

      expect(response.status).toBe(201)

      const responseChurchBody = await response.json()
      expect(responseChurchBody.name).toBe("Igreja Batista Catuaí")
    })
  })
})
