import { version as uuidVersion } from "uuid"
import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("GET /api/v1/users/[id]", () => {
  describe("Anonymous user", () => {
    test("With valid user id", async () => {
      const createdUser = await orchestrator.createUser({
        full_name: "Mesmo Case",
        email: "mesmo.case@curso.dev",
        password: "abc123",
      })
      await orchestrator.activateUser(createdUser.id)

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.id}`,
        {
          method: "GET",
        },
      )

      expect(response.status).toBe(403)
      const responseBody = await response.json()
      expect(responseBody.name).toBe("ForbiddenError")
    })

    test("With valid id reading other user", async () => {
      const mainUser = await orchestrator.createUser({
        full_name: "Main User",
        email: "main@curso.dev",
      })
      await orchestrator.activateUser(mainUser.id)
      const sessionObject = await orchestrator.createSession(mainUser.id)

      const otherUser = await orchestrator.createUser({
        full_name: "Other User",
        email: "other@curso.dev",
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${otherUser.id}`,
        {
          method: "GET",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(403)
      const responseBody = await response.json()
      expect(responseBody.name).toBe("ForbiddenError")
    })

    test("With nonexistent id", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/1ac34dd5-cca3-4ffa-88b2-73cd0fba852c",
        {
          method: "GET",
        },
      )

      expect(response.status).toBe(404)
      const responseBody = await response.json()

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O ID informado não foi encontrado no sistema.",
        action: "Verifique se o ID está digitado corretamente.",
        status_code: 404,
      })
    })
  })
})
