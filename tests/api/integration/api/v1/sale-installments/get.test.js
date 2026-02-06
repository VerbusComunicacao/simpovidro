import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("GET /api/v1/sale-installments", () => {
  describe("Anonymous user", () => {
    test("should return 403", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/sale-installments`,
      )
      expect(response.status).toBe(403)
    })
  })

  describe("Authenticated user", () => {
    let userToken
    let roomId

    beforeAll(async () => {
      const adminUser = await orchestrator.createUser({
        email: "admin-installments@example.com",
        password: "password123",
      })
      await orchestrator.activateAdmUser(adminUser.id)
      await orchestrator.createSession(adminUser.id)
      // admToken removed as it's not needed for registration (which uses userToken)

      const regularUser = await orchestrator.createUser({
        email: "user-installments@example.com",
        password: "password123",
      })
      await orchestrator.activateUser(regularUser.id)
      await orchestrator.setUserFeatures(regularUser.id, [
        "read:content",
        "create:session",
      ])
      const regularSession = await orchestrator.createSession(regularUser.id)
      userToken = regularSession.token

      const roomObj = await orchestrator.createRoom(adminUser.id, {
        price_per_night: 500,
        total_rooms: 10,
      })
      roomId = roomObj.id

      await orchestrator.createRegistration(regularUser.id, { room_id: roomId })
    })

    test("should return list of installments", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/sale-installments`,
        {
          headers: { Cookie: `session_id=${userToken}` },
        },
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      expect(data[0]).toHaveProperty("installment_number")
      expect(data[0]).toHaveProperty("amount")
    })

    test("should filter by sale_id", async () => {
      const salesResp = await fetch(
        `${orchestrator.webserverUrl}/api/v1/sales`,
        {
          headers: { Cookie: `session_id=${userToken}` },
        },
      )
      const sales = await salesResp.json()
      const saleId = sales[0].id

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/sale-installments?sale_id=${saleId}`,
        {
          headers: { Cookie: `session_id=${userToken}` },
        },
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      data.forEach((inst) => {
        expect(inst.sale_id).toBe(saleId)
      })
    })
  })
})
