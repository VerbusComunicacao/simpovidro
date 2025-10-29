import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("GET /api/v1/rooms/[id]", () => {
  describe("Anonymous user", () => {
    test("Can't get room", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/rooms/87562c5a-7f7b-4f9e-b4de-08552758e4e9",
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
        "http://localhost:3000/api/v1/rooms/87562c5a-7f7b-4f9e-b4de-08552758e4e9",
        {
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(403)
    })

    test("Room not found", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateAccount(createdUser.id)

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch(
        "http://localhost:3000/api/v1/rooms/87562c5a-7f7b-4f9e-b4de-08552758e4e9",
        {
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(404)
    })

    test("Get own room successfully", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateAccount(createdUser.id)

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const roomCreated = await orchestrator.createRoom(createdUser.id, {
        price_per_night: 150.0,
        total_rooms: 5,
        available_rooms: 3,
        blocked_rooms: 2,
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/rooms/${roomCreated.id}`,
        {
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(200)

      const room = await response.json()
      expect(room.id).toBe(roomCreated.id)
      expect(room.price_per_night).toBe("150.00")
      expect(room.total_rooms).toBe(5)
      expect(room.available_rooms).toBe(3)
      expect(room.blocked_rooms).toBe(2)
      expect(room).toHaveProperty("created_at")
      expect(room).toHaveProperty("updated_at")
    })

    test("Can't access room from different user", async () => {
      const user1 = await orchestrator.createUser()
      await orchestrator.activateAccount(user1.id)

      const user2 = await orchestrator.createUser()
      await orchestrator.activateAccount(user2.id)

      const session2 = await orchestrator.createSession(user2.id)

      const room = await orchestrator.createRoom(user1.id, {
        price_per_night: 200.0,
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/rooms/${room.id}`,
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
        "http://localhost:3000/api/v1/rooms/invalid-uuid",
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

