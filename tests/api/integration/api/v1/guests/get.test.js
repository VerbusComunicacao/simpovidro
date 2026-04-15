import orchestrator from "tests/orchestrator.js"
import guest from "models/guest.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("GET /api/v1/guests", () => {
  describe("Anonymous user", () => {
    test("Can't get guests", async () => {
      const response = await fetch("http://localhost:3000/api/v1/guests")
      expect(response.status).toBe(401)
    })
  })
  describe("Default user", () => {
    test("Should return an empty array if no guests exist", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["read:content"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch("http://localhost:3000/api/v1/guests", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      })
      expect(response.status).toBe(200)
      const responseBody = await response.json()
      expect(responseBody).toEqual([])
    })

    test("Should return 403", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)

      const sessionObject = await orchestrator.createSession(createdUser.id)

      // Create some guests first
      await guest.create(
        {
          name: "Guest 1",
          badge_name: "Crachá 1",
          email: "guest1@example.com",
          phone: "+5511999999901",
          gender: "Male",
          rg_number: "111111111",
          cpf_number: "111.111.111-01",
          birth_date: "1990-01-01",
        },
        createdUser.id,
      )
      await guest.create(
        {
          name: "Guest 2",
          badge_name: "Crachá 2",
          email: "guest2@example.com",
          phone: "+5511999999902",
          gender: "Female",
          rg_number: "222222222",
          cpf_number: "222.222.222-02",
          birth_date: "1991-01-01",
        },
        createdUser.id,
      )

      const response = await fetch("http://localhost:3000/api/v1/guests", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      })
      expect(response.status).toBe(403)
      const responseBody = await response.json()

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se este usuário possui a feature "read:content".',
        status_code: 403,
      })
    })
  })

  describe("Admin user", () => {
    test("Should return all guests", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateAdmUser(createdUser.id)

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch("http://localhost:3000/api/v1/guests", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      })
      expect(response.status).toBe(200)
      const responseBody = await response.json()

      expect(responseBody.length).toBe(2)
      expect(responseBody[0].name).toBe("Guest 2") // Ordered by created_at DESC
      expect(responseBody[1].name).toBe("Guest 1")
    })
  })
})
