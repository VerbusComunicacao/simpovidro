import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("GET /api/v1/hotels", () => {
  describe("Anonymous user", () => {
    test("Can't list hotels", async () => {
      const response = await fetch("http://localhost:3000/api/v1/hotels")
      expect(response.status).toBe(401)
    })
  })

  describe("Authenticated user", () => {
    test("Without feature 'read:content'", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithoutReadFeature",
      })

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch("http://localhost:3000/api/v1/hotels", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      })

      expect(response.status).toBe(403)
    })

    test("List user's own hotels", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateAccount(createdUser.id)

      const sessionObject = await orchestrator.createSession(createdUser.id)

      // Create multiple hotels for the user
      const hotels = []
      for (let i = 1; i <= 3; i++) {
        const hotel = await orchestrator.createHotel(createdUser.id, {
          name: `Hotel ${i}`,
          city: "São Paulo",
          country: "Brasil",
          email: `hotel${i}@example.com`,
        })
        hotels.push(hotel)
      }

      const response = await fetch("http://localhost:3000/api/v1/hotels", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      })

      expect(response.status).toBe(200)
    })

    test("List empty when user has no hotels", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateAccount(createdUser.id)

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch("http://localhost:3000/api/v1/hotels", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      })

      expect(response.status).toBe(200)

      const hotelsList = await response.json()
      expect(hotelsList).toHaveLength(0)
    })

    test("Only returns user's own hotels", async () => {
      const user1 = await orchestrator.createUser()
      await orchestrator.activateAccount(user1.id)

      const user2 = await orchestrator.createUser()
      await orchestrator.activateAccount(user2.id)

      const session1 = await orchestrator.createSession(user1.id)
      const session2 = await orchestrator.createSession(user2.id)

      // User 1 creates hotels
      await orchestrator.createHotel(user1.id, {
        name: "User 1 Hotel 1",
        city: "São Paulo",
        country: "Brasil",
      })

      await orchestrator.createHotel(user1.id, {
        name: "User 1 Hotel 2",
        city: "Rio de Janeiro",
        country: "Brasil",
      })

      // User 2 creates hotels
      await orchestrator.createHotel(user2.id, {
        name: "User 2 Hotel 1",
        city: "Belo Horizonte",
        country: "Brasil",
      })

      // User 1 should only see their own hotels
      const response1 = await fetch("http://localhost:3000/api/v1/hotels", {
        headers: {
          Cookie: `session_id=${session1.token}`,
        },
      })

      expect(response1.status).toBe(200)
      const user1Hotels = await response1.json()
      expect(user1Hotels).toHaveLength(2)
      expect(user1Hotels.every((hotel) => hotel.name.includes("User 1"))).toBe(
        true,
      )

      // User 2 should only see their own hotels
      const response2 = await fetch("http://localhost:3000/api/v1/hotels", {
        headers: {
          Cookie: `session_id=${session2.token}`,
        },
      })

      expect(response2.status).toBe(200)
      const user2Hotels = await response2.json()
      expect(user2Hotels).toHaveLength(1)
      expect(user2Hotels[0].name).toBe("User 2 Hotel 1")
    })

    test("Hotels are ordered by creation date (newest first)", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateAccount(createdUser.id)

      const sessionObject = await orchestrator.createSession(createdUser.id)

      // Create hotels with delays to ensure different timestamps
      await orchestrator.createHotel(createdUser.id, {
        name: "First Hotel",
        city: "São Paulo",
        country: "Brasil",
      })

      await new Promise((resolve) => setTimeout(resolve, 100))

      await orchestrator.createHotel(createdUser.id, {
        name: "Second Hotel",
        city: "Rio de Janeiro",
        country: "Brasil",
      })

      await new Promise((resolve) => setTimeout(resolve, 100))

      await orchestrator.createHotel(createdUser.id, {
        name: "Third Hotel",
        city: "Belo Horizonte",
        country: "Brasil",
      })

      const response = await fetch("http://localhost:3000/api/v1/hotels", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      })

      expect(response.status).toBe(200)

      const hotelsList = await response.json()
      expect(hotelsList).toHaveLength(3)
      expect(hotelsList[0].name).toBe("Third Hotel")
      expect(hotelsList[1].name).toBe("Second Hotel")
      expect(hotelsList[2].name).toBe("First Hotel")
    })
  })
})
