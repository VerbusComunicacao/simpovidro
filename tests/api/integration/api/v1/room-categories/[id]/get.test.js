import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("GET /api/v1/room-categories/[id]", () => {
  describe("Anonymous user", () => {
    test("Can't get room-category", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/room-categories/87562c5a-7f7b-4f9e-b4de-08552758e4e9",
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
        "http://localhost:3000/api/v1/room-categories/87562c5a-7f7b-4f9e-b4de-08552758e4e9",
        {
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(403)
    })

    test("Room-category not found", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["read:content"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch(
        "http://localhost:3000/api/v1/room-categories/87562c5a-7f7b-4f9e-b4de-08552758e4e9",
        {
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(404)
    })

    test("Get own room-category successfully", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["read:content"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const rcCreated = await orchestrator.createRoomCategory(createdUser.id, {
        name: "My Category",
        max_adults: 2,
        max_children: 1,
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/room-categories/${rcCreated.id}`,
        {
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(200)

      const roomCategory = await response.json()
      expect(roomCategory.id).toBe(rcCreated.id)
      expect(roomCategory.name).toBe("My Category")
      expect(roomCategory.max_adults).toBe(2)
      expect(roomCategory.max_children).toBe(1)
      expect(roomCategory).toHaveProperty("created_at")
      expect(roomCategory).toHaveProperty("updated_at")
    })

    test("Can't access room-category from different user", async () => {
      const user1 = await orchestrator.createUser()
      await orchestrator.activateUser(user1.id)
      await orchestrator.setUserFeatures(user1.id, ["create:content"])

      const user2 = await orchestrator.createUser()
      await orchestrator.activateUser(user2.id)
      await orchestrator.setUserFeatures(user2.id, ["read:content"])

      const session2 = await orchestrator.createSession(user2.id)

      const rc = await orchestrator.createRoomCategory(user1.id, {
        name: "U1 Category",
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/room-categories/${rc.id}`,
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
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["read:content"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch(
        "http://localhost:3000/api/v1/room-categories/invalid-uuid",
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
