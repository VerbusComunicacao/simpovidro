import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("GET /api/v1/rooms", () => {
  describe("Anonymous user", () => {
    test("Can't list rooms", async () => {
      const response = await fetch("http://localhost:3000/api/v1/rooms")
      expect(response.status).toBe(401)
    })
  })

  describe("Authenticated user", () => {
    test("Without feature 'read:content'", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithoutReadFeature",
      })

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch("http://localhost:3000/api/v1/rooms", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      })

      expect(response.status).toBe(403)
    })

    test("List user's own rooms", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["read:content"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      // Create multiple rooms for the user
      for (let i = 1; i <= 3; i++) {
        await orchestrator.createRoom(createdUser.id, {
          price_per_night: 100 + i * 50,
          total_rooms: i,
          available_rooms: i - 1,
          blocked_rooms: 0,
        })
      }

      const response = await fetch("http://localhost:3000/api/v1/rooms", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      })

      expect(response.status).toBe(200)

      const list = await response.json()
      expect(list).toHaveLength(3)
      expect(list[0].price_per_night).toBe("250.00")
      expect(list[1].price_per_night).toBe("200.00")
      expect(list[2].price_per_night).toBe("150.00")
    })

    test("List empty when user has no rooms", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["read:content"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch("http://localhost:3000/api/v1/rooms", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      })

      expect(response.status).toBe(200)

      const list = await response.json()
      expect(list).toHaveLength(0)
    })

    test("Only returns user's own rooms", async () => {
      const user1 = await orchestrator.createUser()
      await orchestrator.activateUser(user1.id)
      await orchestrator.setUserFeatures(user1.id, ["create:content", "read:content"])

      const user2 = await orchestrator.createUser()
      await orchestrator.activateUser(user2.id)
      await orchestrator.setUserFeatures(user2.id, ["create:content", "read:content"])

      const session1 = await orchestrator.createSession(user1.id)
      const session2 = await orchestrator.createSession(user2.id)

      // User 1 creates rooms
      await orchestrator.createRoom(user1.id, { price_per_night: 100 })
      await orchestrator.createRoom(user1.id, { price_per_night: 200 })

      // User 2 creates rooms
      await orchestrator.createRoom(user2.id, { price_per_night: 300 })

      // User 1 should only see their own rooms
      const response1 = await fetch("http://localhost:3000/api/v1/rooms", {
        headers: {
          Cookie: `session_id=${session1.token}`,
        },
      })

      expect(response1.status).toBe(200)
      const user1List = await response1.json()
      expect(user1List).toHaveLength(2)
      expect(
        user1List.every(
          (room) =>
            room.price_per_night === "200.00" ||
            room.price_per_night === "100.00",
        ),
      ).toBe(true)

      // User 2 should only see their own rooms
      const response2 = await fetch("http://localhost:3000/api/v1/rooms", {
        headers: {
          Cookie: `session_id=${session2.token}`,
        },
      })

      expect(response2.status).toBe(200)
      const user2List = await response2.json()
      expect(user2List).toHaveLength(1)
      expect(user2List[0].price_per_night).toBe("300.00")
    })
  })
})
