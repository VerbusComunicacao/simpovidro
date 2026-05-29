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
                badge_name: user.full_name.substring(0, 23),
                email: user.email,
                phone: "11999999999",
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

    test("should return orders when user has made an order for another person", async () => {
      // 1. Create Requester (A) and Guest (B)
      const userA = await orchestrator.createUser()
      await orchestrator.activateUser(userA.id)
      const sessionA = await orchestrator.createSession(userA.id)
      const tokenA = sessionA.token

      const userB = await orchestrator.createUser()
      await orchestrator.activateUser(userB.id)
      const sessionB = await orchestrator.createSession(userB.id)
      const tokenB = sessionB.token

      // 2. Create Hotel & Room
      const hotel = await orchestrator.createHotel(userA.id)
      const room = await orchestrator.createRoom(userA.id, {
        hotel_id: hotel.id,
        available_rooms: 5,
      })

      // 3. Register User B using User A's session
      const registrationResponse = await fetch(
        "http://localhost:3000/api/v1/registrations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: `session_id=${tokenA}`,
          },
          body: JSON.stringify({
            room_id: room.id,
            guests_data: [
              {
                name: userB.full_name,
                badge_name: userB.full_name.substring(0, 23),
                email: userB.email,
                phone: "11988888888",
                gender: "Feminino",
                rg_number: "987654321",
                cpf_number: "987.654.321-00",
                birth_date: "1992-02-02",
              },
            ],
          }),
        },
      )

      expect(registrationResponse.status).toBe(201)

      // 4. Fetch Requester A's orders (should return B's order since A requested it)
      const responseA = await fetch("http://localhost:3000/api/v1/my-orders", {
        headers: {
          cookie: `session_id=${tokenA}`,
        },
      })
      const responseBodyA = await responseA.json()
      expect(responseA.status).toBe(200)
      expect(responseBodyA).toHaveLength(1)
      expect(responseBodyA[0].hotel_name).toBe(hotel.name)

      // 5. Fetch Guest B's orders (should also return the order since B is the lead guest)
      const responseB = await fetch("http://localhost:3000/api/v1/my-orders", {
        headers: {
          cookie: `session_id=${tokenB}`,
        },
      })
      const responseBodyB = await responseB.json()
      expect(responseB.status).toBe(200)
      expect(responseBodyB).toHaveLength(1)
      expect(responseBodyB[0].hotel_name).toBe(hotel.name)
    })
  })
})
