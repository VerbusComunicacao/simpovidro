import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("GET /api/v1/my-orders", () => {
  describe("Anonymous User", () => {
    test("should return 400 Bad Request", async () => {
      const response = await fetch("http://localhost:3000/api/v1/my-orders")
      expect(response.status).toBe(400)
    })
  })

  describe("Authenticated User", () => {
    test("should return empty list when user has no orders", async () => {
      const user = await orchestrator.createUser()
      await orchestrator.activateUser(user.id)
      const session = await orchestrator.createSession(user.id)
      const token = session.token

      const response = await fetch("http://localhost:3000/api/v1/my-orders", {
        headers: {
          cookie: `session_id=${token}`,
        },
      })
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual([])
    })

    test("should return orders when user has orders", async () => {
      // 1. Create User & Session
      const user = await orchestrator.createUser()
      await orchestrator.activateUser(user.id)
      const session = await orchestrator.createSession(user.id)
      const token = session.token

      // 2. Create Hotel & Room
      const hotel = await orchestrator.createHotel(user.id)
      const room = await orchestrator.createRoom(user.id, {
        hotel_id: hotel.id,
        available_rooms: 5, // Ensure availability
      })

      // 3. Register Guest & Create Sale (via existing flow or direct DB insertion)

      // Insert Sale manually or via orchestrator helper if available.
      // Since orchestrator might not have createSale, we rely on the API flow or modify orchestrator.
      // For this test, let's use the POST /registrations endpoint to simulate real flow.

      const registrationResponse = await fetch(
        "http://localhost:3000/api/v1/registrations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: `session_id=${token}`,
          },
          body: JSON.stringify({
            room_id: room.id,
            guests_data: [
              {
                name: user.full_name,
                email: user.email,
                phone: "123456789",
                gender: "Masculino",
                rg_number: "123456789",
                cpf_number: "123.456.789-00",
                birth_date: "1990-01-01",
              },
            ],
          }),
        },
      )

      expect(registrationResponse.status).toBe(201)

      // 4. Fetch My Orders
      const response = await fetch("http://localhost:3000/api/v1/my-orders", {
        headers: {
          cookie: `session_id=${token}`,
        },
      })
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toHaveLength(1)
      expect(responseBody[0].hotel_name).toBe(hotel.name)
      expect(responseBody[0].room_name).toBe(room.name)
    })
  })
})
