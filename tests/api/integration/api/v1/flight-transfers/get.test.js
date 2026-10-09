import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("GET /api/v1/flight-transfers", () => {
  describe("Anonymous user", () => {
    test("Should return 401 when unauthenticated", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/flight-transfers`,
      )

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.name).toBe("UnauthorizedError")
    })
  })

  describe("Authenticated user", () => {
    let userToken
    let userId
    let hotelId

    beforeAll(async () => {
      const adminUser = await orchestrator.createUser({
        full_name: "Admin Transfer User",
        email: "admin-transfer-get@example.com",
        password: "password123",
      })
      await orchestrator.activateAdmUser(adminUser.id)
      const adminSession = await orchestrator.createSession(adminUser.id)

      // Create hotel
      const hotelRes = await fetch(
        `${orchestrator.webserverUrl}/api/v1/hotels`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${adminSession.token}`,
          },
          body: JSON.stringify({
            name: "Hotel Transfer Test 2",
            city: "Salvador",
            country: "Brasil",
            check_in_date: "2026-11-01",
            check_out_date: "2026-11-05",
          }),
        },
      )
      const hotelData = await hotelRes.json()
      hotelId = hotelData.id

      // Activate hotel
      await fetch(
        `${orchestrator.webserverUrl}/api/v1/hotels/${hotelId}/activate`,
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${adminSession.token}`,
          },
        },
      )

      // Regular user
      const user = await orchestrator.createUser({
        full_name: "Usuario Consulta Voo",
        email: "consulta-voo@example.com",
        password: "password123",
      })
      await orchestrator.activateUser(user.id)
      const session = await orchestrator.createSession(user.id)
      userToken = session.token
      userId = user.id

      // Create a flight transfer
      await fetch(`${orchestrator.webserverUrl}/api/v1/flight-transfers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${userToken}`,
        },
        body: JSON.stringify({
          hotel_id: hotelId,
          participant_name: "Viajante Teste",
          in_airline: "Azul",
          in_locator: "AZU999",
        }),
      })
    })

    test("Should list user's flight transfers", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/flight-transfers`,
        {
          headers: {
            Cookie: `session_id=${userToken}`,
          },
        },
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(Array.isArray(body)).toBe(true)
      expect(body.length).toBeGreaterThanOrEqual(1)
      const item = body.find((b) => b.participant_name === "Viajante Teste")
      expect(item).toBeDefined()
      expect(item.in_airline).toBe("Azul")
      expect(item.in_locator).toBe("AZU999")
    })

    test("Should get user defaults and active hotel", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/flight-transfers/defaults`,
        {
          headers: {
            Cookie: `session_id=${userToken}`,
          },
        },
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.hotel).toBeDefined()
      expect(body.hotel.id).toBe(hotelId)
      expect(body.user).toBeDefined()
      expect(body.user.email).toBe("consulta-voo@example.com")
    })
  })
})
