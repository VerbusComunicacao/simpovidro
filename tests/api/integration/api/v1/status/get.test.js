import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
})

describe("GET /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieving current system status", async () => {
      const response = await fetch("http://localhost:3000/api/v1/status")
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({
        updated_at: expect.any(String),
        dependencies: {
          database: {
            version: "16.0",
            max_connections: 100,
            opened_connections: 1,
          },
        },
      })

      const parsedDate = new Date(responseBody.updated_at).toISOString()
      expect(responseBody.updated_at).toBe(parsedDate)
    })
  })
})
