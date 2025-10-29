import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("GET /api/v1/room-types/[id]", () => {
  describe("Anonymous user", () => {
    test("Can't get room-type", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/room-types/87562c5a-7f7b-4f9e-b4de-08552758e4e9",
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
        "http://localhost:3000/api/v1/room-types/87562c5a-7f7b-4f9e-b4de-08552758e4e9",
        {
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(403)
    })

    test("Room-type not found", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateAccount(createdUser.id)

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch(
        "http://localhost:3000/api/v1/room-types/87562c5a-7f7b-4f9e-b4de-08552758e4e9",
        {
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(404)
    })

    test("Get own room-type successfully", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateAccount(createdUser.id)

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const rtCreated = await orchestrator.createRoomType(createdUser.id, {
        name: "My Type",
        description: "Basic",
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/room-types/${rtCreated.id}`,
        {
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(200)

      const roomType = await response.json()
      expect(roomType.id).toBe(rtCreated.id)
      expect(roomType.name).toBe("My Type")
      expect(roomType.description).toBe("Basic")
      expect(roomType).toHaveProperty("created_at")
      expect(roomType).toHaveProperty("updated_at")
    })

    test("Can't access room-type from different user", async () => {
      const user1 = await orchestrator.createUser()
      await orchestrator.activateAccount(user1.id)

      const user2 = await orchestrator.createUser()
      await orchestrator.activateAccount(user2.id)

      const session2 = await orchestrator.createSession(user2.id)

      // User 1 creates a room-type
      const rt = await orchestrator.createRoomType(user1.id, {
        name: "U1 Type",
      })

      // User 2 tries to access User 1's room-type
      const response = await fetch(
        `http://localhost:3000/api/v1/room-types/${rt.id}`,
        {
          headers: {
            Cookie: `session_id=${session2.token}`,
          },
        },
      )

      expect(response.status).toBe(404)
    })

    test("Invalid UUID format", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateAccount(createdUser.id)

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch(
        "http://localhost:3000/api/v1/room-types/invalid-uuid",
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
