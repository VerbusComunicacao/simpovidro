import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("POST /api/v1/discounts", () => {
  describe("Anonymous user", () => {
    test("Can't create discount", async () => {
      const response = await fetch("http://localhost:3000/api/v1/discounts", {
        method: "POST",
        body: JSON.stringify({
          name: "Desconto Teste",
          value: 10.0,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })
      expect(response.status).toBe(401)
    })
  })

  describe("Default user", () => {
    test("Without feature 'create:content'", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch("http://localhost:3000/api/v1/discounts", {
        method: "POST",
        body: JSON.stringify({
          name: "Desconto Teste",
          value: 10.0,
        }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
      })

      expect(response.status).toBe(403)
    })

    test("Activated account with 'create:content' feature", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateAdmUser(createdUser.id)
      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch("http://localhost:3000/api/v1/discounts", {
        method: "POST",
        body: JSON.stringify({
          name: "Desconto Especial",
          value: 15.5,
        }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
      })

      expect(response.status).toBe(201)

      const discountCreated = await response.json()
      expect(discountCreated).toEqual({
        id: expect.any(String),
        name: "Desconto Especial",
        value: "15.50",
        created_at: expect.any(String),
        updated_at: expect.any(String),
      })
    })

    test("With missing fields", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateAdmUser(createdUser.id)
      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch("http://localhost:3000/api/v1/discounts", {
        method: "POST",
        body: JSON.stringify({
          name: "Desconto Sem Valor",
        }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
      })

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.name).toBe("ValidationError")
      expect(body.message).toContain("Campos obrigatórios ausentes: value")
    })
  })
})
