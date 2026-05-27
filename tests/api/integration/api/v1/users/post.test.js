import { version as uuidVersion } from "uuid"
import orchestrator from "tests/orchestrator.js"
import user from "models/user.js"
import password from "models/password.js"
import database from "infra/database"

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
          full_name: "Pedigru Três",
          email: "contato@curso.dev",
          password: "abc123",
        }),
      })

      expect(response.status).toBe(201)

      const responseBody = await response.json()

      expect(responseBody).toEqual({
        id: responseBody.id,
        full_name: "Pedigru Três",
        email: "contato@curso.dev",
        features: ["read:activation_token"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      })

      expect(uuidVersion(responseBody.id)).toBe(4)
      expect(Date.parse(responseBody.created_at)).not.toBeNaN()
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN()

      const userInDatabase = await user.findOneByEmail("contato@curso.dev")
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
          full_name: "Email Duplicado 1",
          email: "duplicado@curso.dev",
          password: "abc123",
        }),
      })

      expect(response1.status).toBe(201)

      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: "Email Duplicado 2",
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

    test("Should resend activation email if user is unactivated and previous token expired", async () => {
      const userPayload = {
        full_name: "Test User Resend",
        email: "resend_test@example.com",
        password: "password123",
      }

      // 1. Initial registration
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userPayload),
      })
      expect(response1.status).toBe(201)

      // 2. Manually expire tokens for this user in DB
      const userFound = await database.query({
        text: "SELECT id FROM users WHERE email = $1",
        values: [userPayload.email],
      })
      const userId = userFound.rows[0].id

      await database.query({
        text: "UPDATE user_activation_tokens SET expires_at = NOW() - interval '1 hour' WHERE user_id = $1",
        values: [userId],
      })

      // 3. Register again with same email
      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userPayload),
      })

      expect(response2.status).toBe(201)
      const body2 = await response2.json()
      expect(body2.id).toBe(userId)

      // 4. Check if a new token was created
      const tokens = await database.query({
        text: "SELECT * FROM user_activation_tokens WHERE user_id = $1 AND expires_at > NOW()",
        values: [userId],
      })
      expect(tokens.rowCount).toBe(1)

      // 5. Check if the email was sent
      const lastEmail = await orchestrator.getLastEmail()
      expect(lastEmail.sender).toBe("<simpovidro@abravidro.org.br>")
      expect(lastEmail.recipients[0]).toBe(`<${userPayload.email}>`)
      expect(lastEmail.text).toContain(`ativar/${tokens.rows[0].token}`)
    })

    test("Should NOT resend activation email if user still has a valid token", async () => {
      const userPayload = {
        full_name: "Test User No Resend",
        email: "no_resend_test@example.com",
        password: "password123",
      }

      // 1. Initial registration
      await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userPayload),
      })

      // 2. Try to register again immediately (token still valid)
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userPayload),
      })

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.message).toBe("O email informado já está sendo utilizado.")
    })
  })
})
