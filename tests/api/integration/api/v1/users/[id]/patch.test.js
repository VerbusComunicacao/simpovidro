import orchestrator from "tests/orchestrator.js"
import { version as uuidVersion } from "uuid"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("PATCH /api/v1/users/[id]", () => {
  describe("Anonymous user", () => {
    test("With nonexistent id", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/1ac34dd5-cca3-4ffa-88b2-73cd0fba852c",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: "New Name",
          }),
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
  describe("Authenticated user", () => {
    test("With nonexistent id", async () => {
      const authenticatedUser = await orchestrator.createUser({
        full_name: "authenticatedUser",
      })
      await orchestrator.activateUser(authenticatedUser.id)

      const sessionObject = await orchestrator.createSession(
        authenticatedUser.id,
      )

      const response = await fetch(
        "http://localhost:3000/api/v1/users/1ac34dd5-cca3-4ffa-88b2-73cd0fba852c",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            full_name: "New Name",
          }),
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

    test("With duplicated 'email'", async () => {
      await orchestrator.createUser({
        email: "duplicatedEmail1@curso.dev",
      })

      const createdUser2 = await orchestrator.createUser({
        email: "duplicatedEmail2@curso.dev",
      })
      await orchestrator.activateUser(createdUser2.id)
      const sessionObject = await orchestrator.createSession(createdUser2.id)

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser2.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            email: "duplicatedEmail1@curso.dev",
          }),
        },
      )

      expect(response.status).toBe(400)

      const responseBody = await response.json()

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O email informado já está sendo utilizado.",
        action: "Utilize outro email para realizar esta operação.",
        status_code: 400,
      })
    })

    test("With unique 'email'", async () => {
      const userCreated = await orchestrator.createUser()
      await orchestrator.activateUser(userCreated.id)
      const sessionObject = await orchestrator.createSession(userCreated.id)

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${userCreated.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            email: "uniqueEmail@curso.dev",
          }),
        },
      )

      expect(response.status).toBe(200)
      const responseBody = await response.json()

      expect(responseBody).toEqual({
        id: userCreated.id,
        full_name: userCreated.full_name,
        email: "uniqueEmail@curso.dev",
        features: [
          "create:session",
          "read:session",
          "create:guest",
          "read:guest",
          "read:user",
          "update:user",
        ],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      })
      expect(uuidVersion(responseBody.id)).toBe(4)
      expect(Date.parse(responseBody.created_at)).not.toBeNaN()
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN()

      expect(responseBody.updated_at > responseBody.created_at).toBe(true)
    })

    test("With others user info (should fail)", async () => {
      const mainUser = await orchestrator.createUser({ email: "main@test.com" })
      await orchestrator.activateUser(mainUser.id)
      const sessionObject = await orchestrator.createSession(mainUser.id)

      const otherUser = await orchestrator.createUser({
        email: "other@test.com",
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${otherUser.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            full_name: "Evil Change",
          }),
        },
      )

      expect(response.status).toBe(403)
    })
  })
})
