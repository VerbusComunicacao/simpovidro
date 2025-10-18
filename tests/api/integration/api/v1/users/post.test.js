import { version as uuidVersion } from "uuid"
import orchestrator from "tests/orchestrator.js"
import user from "models/user.js"
import password from "models/password.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "pedigru3",
          email: "contato@curso.dev",
          password: "abc123",
        }),
      })

      expect(response.status).toBe(201)

      const responseBody = await response.json()

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "pedigru3",
        email: "contato@curso.dev",
        features: ["read:activation_token"],
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      })

      expect(uuidVersion(responseBody.id)).toBe(4)
      expect(Date.parse(responseBody.created_at)).not.toBeNaN()
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN()

      const userInDatabase = await user.findOneByUsername("pedigru3")
      const correctPasswordMatch = await password.compare(
        "abc123",
        userInDatabase.password,
      )

      expect(correctPasswordMatch).toBe(true)

      const incorrectPasswordMatch = await password.compare(
        "abc1234",
        userInDatabase.password,
      )

      expect(incorrectPasswordMatch).toBe(false)
    })
    test("With duplicated 'email'", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "emailduplicado1",
          email: "duplicado@curso.dev",
          password: "abc123",
        }),
      })

      expect(response1.status).toBe(201)

      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "emailduplicado2",
          email: "Duplicado@curso.dev",
          password: "abc123",
        }),
      })

      expect(response2.status).toBe(400)

      const responseBody = await response2.json()

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O email informado já está sendo utilizado.",
        action: "Utilize outro email para realizar esta operação.",
        status_code: 400,
      })
    })
    test("With duplicated 'username'", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "usernameduplicado",
          email: "email1@curso.dev",
          password: "abc123",
        }),
      })

      expect(response1.status).toBe(201)

      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "UsernameDuplicado",
          email: "email2@curso.dev",
          password: "abc123",
        }),
      })

      expect(response2.status).toBe(400)

      const responseBody = await response2.json()

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O username informado já está sendo utilizado.",
        action: "Utilize outro username para realizar esta operação.",
        status_code: 400,
      })
    })
  })
})
