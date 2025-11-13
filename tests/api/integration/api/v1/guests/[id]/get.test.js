import orchestrator from "tests/orchestrator.js"
import guest from "models/guest.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("GET /api/v1/guests/[id]", () => {
  describe("Default user", () => {
    test("Should return a guest by ID", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["read:guest"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const createdGuest = await guest.create(
        {
          name: "Guest to Find",
          email: "findme@example.com",
          phone: "+5511999999903",
          gender: "Female",
          rg_number: "333333333",
          cpf_number: "333.333.333-03",
          birth_date: "1993-01-01",
        },
        createdUser.id,
      )

      const response = await fetch(
        `http://localhost:3000/api/v1/guests/${createdGuest.id}`,
        {
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )
      expect(response.status).toBe(200)
      const responseBody = await response.json()

      expect(responseBody.id).toBe(createdGuest.id)
      expect(responseBody.email).toBe("findme@example.com")
    })

    test("Should return 404 if guest not found", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["read:guest"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const nonExistentId = "87562c5a-7f7b-4f9e-b4de-08552758e4e9"
      const response = await fetch(
        `http://localhost:3000/api/v1/guests/${nonExistentId}`,
        {
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )
      expect(response.status).toBe(404)

      const responseBody = await response.json()
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O ID do hóspede informado não foi encontrado no sistema.",
        action: "Verifique se o ID está digitado corretamente.",
        status_code: 404,
      })
    })
  })
})
