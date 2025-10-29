import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("GET /api/v1/hotels/[id]", () => {
  describe("Anonymous user", () => {
    test("Can't get hotel", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/hotels/87562c5a-7f7b-4f9e-b4de-08552758e4e9",
      )
      expect(response.status).toBe(401)
    })
  })

  describe("Authenticated user", () => {
    test("Without feature 'read:content'", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithoutReadFeature",
      })

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch(
        "http://localhost:3000/api/v1/hotels/87562c5a-7f7b-4f9e-b4de-08552758e4e9",
        {
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(403)
    })

    test("Hotel not found", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateAccount(createdUser.id)

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch(
        "http://localhost:3000/api/v1/hotels/87562c5a-7f7b-4f9e-b4de-08552758e4e9",
        {
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(404)
    })

    test("Get own hotel successfully", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateAccount(createdUser.id)

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const hotelCreated = await orchestrator.createHotel(createdUser.id, {
        name: "My Hotel",
        city: "São Paulo",
        country: "Brasil",
        email: "myhotel@example.com",
        phone: "(11) 99999-9999",
        address: "Rua das Flores, 123",
        state: "SP",
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/hotels/${hotelCreated.id}`,
        {
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(200)

      const hotel = await response.json()
      expect(hotel.id).toBe(hotelCreated.id)
      expect(hotel.name).toBe("My Hotel")
      expect(hotel.city).toBe("São Paulo")
      expect(hotel.country).toBe("Brasil")
      expect(hotel.email).toBe("myhotel@example.com")
      expect(hotel.phone).toBe("(11) 99999-9999")
      expect(hotel.address).toBe("Rua das Flores, 123")
      expect(hotel.state).toBe("SP")
      expect(hotel).toHaveProperty("created_at")
      expect(hotel).toHaveProperty("updated_at")
    })

    test("Can't access hotel from different user", async () => {
      const user1 = await orchestrator.createUser()
      await orchestrator.activateAccount(user1.id)

      const user2 = await orchestrator.createUser()
      await orchestrator.activateAccount(user2.id)

      const session2 = await orchestrator.createSession(user2.id)

      // User 1 creates a hotel
      const hotelCreated = await orchestrator.createHotel(user1.id, {
        name: "User 1 Hotel",
        city: "São Paulo",
        country: "Brasil",
      })

      // User 2 tries to access User 1's hotel
      const response = await fetch(
        `http://localhost:3000/api/v1/hotels/${hotelCreated.id}`,
        {
          headers: {
            Cookie: `session_id=${session2.token}`,
          },
        },
      )

      expect(response.status).toBe(404)
    })

    test("Get hotel with all fields", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateAccount(createdUser.id)

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const hotelData = {
        name: "Complete Hotel",
        city: "Rio de Janeiro",
        country: "Brasil",
        email: "complete@hotel.com",
        phone: "(21) 88888-8888",
        address: "Av. Copacabana, 456",
        state: "RJ",
      }

      const hotelCreated = await orchestrator.createHotel(
        createdUser.id,
        hotelData,
      )

      const response = await fetch(
        `http://localhost:3000/api/v1/hotels/${hotelCreated.id}`,
        {
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(200)

      const hotel = await response.json()
      expect(hotel.id).toBe(hotelCreated.id)
      expect(hotel.name).toBe(hotelData.name)
      expect(hotel.city).toBe(hotelData.city)
      expect(hotel.country).toBe(hotelData.country)
      expect(hotel.email).toBe(hotelData.email)
      expect(hotel.phone).toBe(hotelData.phone)
      expect(hotel.address).toBe(hotelData.address)
      expect(hotel.state).toBe(hotelData.state)
      expect(hotel).toHaveProperty("created_at")
      expect(hotel).toHaveProperty("updated_at")
    })

    test("Invalid UUID format", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateAccount(createdUser.id)

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch(
        "http://localhost:3000/api/v1/hotels/invalid-uuid",
        {
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(400)
    })
  })
})
