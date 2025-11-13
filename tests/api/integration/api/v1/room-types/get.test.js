import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("GET /api/v1/room-types", () => {
  describe("Anonymous user", () => {
    test("Can't list room-types", async () => {
      const response = await fetch("http://localhost:3000/api/v1/room-types")
      expect(response.status).toBe(401)
    })
  })

  describe("Authenticated user", () => {
    test("Without feature 'read:content'", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithoutReadFeature",
      })

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch("http://localhost:3000/api/v1/room-types", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      })

      expect(response.status).toBe(403)
    })

    test("List user's own room-types", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)

      await orchestrator.setUserFeatures(createdUser.id, ["read:content"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      // Create multiple room-types for the user
      for (let i = 1; i <= 3; i++) {
        await orchestrator.createRoomType(createdUser.id, {
          name: `RoomType ${i}`,
          description: `Description ${i}`,
        })
      }

      const response = await fetch("http://localhost:3000/api/v1/room-types", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      })

      expect(response.status).toBe(200)

      const list = await response.json()
      expect(list).toHaveLength(3)
      expect(list[0].name).toBe("RoomType 3")
      expect(list[1].name).toBe("RoomType 2")
      expect(list[2].name).toBe("RoomType 1")
    })

    test("List empty when user has no room-types", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["read:content"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch("http://localhost:3000/api/v1/room-types", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      })

      expect(response.status).toBe(200)

      const list = await response.json()
      expect(list).toHaveLength(0)
    })

    test("Only returns user's own room-types", async () => {
      const user1 = await orchestrator.createUser()
      await orchestrator.activateUser(user1.id)
      await orchestrator.setUserFeatures(user1.id, ["read:content"])

      const user2 = await orchestrator.createUser()
      await orchestrator.activateUser(user2.id)
      await orchestrator.setUserFeatures(user2.id, ["read:content"])

      const session1 = await orchestrator.createSession(user1.id)
      const session2 = await orchestrator.createSession(user2.id)

      // User 1 creates room-types
      await orchestrator.createRoomType(user1.id, { name: "U1 Type 1" })
      await orchestrator.createRoomType(user1.id, { name: "U1 Type 2" })

      // User 2 creates room-types
      await orchestrator.createRoomType(user2.id, { name: "U2 Type 1" })

      // User 1 should only see their own room-types
      const response1 = await fetch("http://localhost:3000/api/v1/room-types", {
        headers: {
          Cookie: `session_id=${session1.token}`,
        },
      })

      expect(response1.status).toBe(200)
      const user1List = await response1.json()
      expect(user1List).toHaveLength(2)
      expect(user1List.every((rt) => rt.name.startsWith("U1"))).toBe(true)

      // User 2 should only see their own room-types
      const response2 = await fetch("http://localhost:3000/api/v1/room-types", {
        headers: {
          Cookie: `session_id=${session2.token}`,
        },
      })

      expect(response2.status).toBe(200)
      const user2List = await response2.json()
      expect(user2List).toHaveLength(1)
      expect(user2List[0].name).toBe("U2 Type 1")
    })
  })
})
