import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("GET /api/v1/discounts", () => {
  describe("Anonymous user", () => {
    test("Can retrieve all discounts", async () => {
      // Create some discounts via orchestrator
      await orchestrator.createDiscount({ name: "Desconto B", value: 10.0 })
      await orchestrator.createDiscount({ name: "Desconto A", value: 20.0 })

      const response = await fetch("http://localhost:3000/api/v1/discounts")
      expect(response.status).toBe(200)

      const body = await response.json()
      expect(Array.isArray(body)).toBe(true)
      expect(body.length).toBeGreaterThanOrEqual(2)

      // Verify sorting by name ASC
      const names = body.map((d) => d.name)
      const sortedNames = [...names].sort()
      expect(names).toEqual(sortedNames)

      const discountA = body.find((d) => d.name === "Desconto A")
      expect(discountA).toEqual({
        id: expect.any(String),
        name: "Desconto A",
        value: "20.00",
        created_at: expect.any(String),
        updated_at: expect.any(String),
      })
    })
  })

  describe("Authenticated user", () => {
    test("Can also retrieve all discounts", async () => {
      const createdUser = await orchestrator.createUser()
      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch("http://localhost:3000/api/v1/discounts", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      })

      expect(response.status).toBe(200)
    })
  })
})
