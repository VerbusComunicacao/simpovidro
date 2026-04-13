import database from "infra/database"
import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("DELETE /api/v1/room-categories/[id]", () => {
  describe("Anonymous user", () => {
    test("Can't delete room-category", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/room-categories/87562c5a-7f7b-4f9e-b4de-08552758e4e9",
        {
          method: "DELETE",
        },
      )
      expect(response.status).toBe(401)
    })
  })

  describe("Authenticated user", () => {
    test("Without feature 'delete:content'", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithoutDeleteFeature",
      })

      const createdCategory = await orchestrator.createRoomCategory(
        createdUser.id,
      )

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch(
        `http://localhost:3000/api/v1/room-categories/${createdCategory.id}`,
        {
          method: "DELETE",
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
      await orchestrator.setUserFeatures(createdUser.id, ["delete:content"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch(
        "http://localhost:3000/api/v1/room-categories/87562c5a-7f7b-4f9e-b4de-08552758e4e9",
        {
          method: "DELETE",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(404)
    })

    test("Delete room-category successfully", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, [
        "create:content",
        "delete:content",
      ])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const rcCreated = await orchestrator.createRoomCategory(createdUser.id, {
        name: "Category to Delete",
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/room-categories/${rcCreated.id}`,
        {
          method: "DELETE",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(204)

      const results = await database.query({
        text: `SELECT * FROM "room-categories" WHERE id = $1`,
        values: [rcCreated.id],
      })

      expect(results.rowCount).toBe(0)
    })

    test("Delete room-category from different user", async () => {
      const user1 = await orchestrator.createUser()
      await orchestrator.activateUser(user1.id)
      await orchestrator.setUserFeatures(user1.id, ["create:content"])

      const user2 = await orchestrator.createUser()
      await orchestrator.activateUser(user2.id)
      await orchestrator.setUserFeatures(user2.id, ["delete:content"])

      const session1 = await orchestrator.createSession(user1.id)
      const session2 = await orchestrator.createSession(user2.id)

      const createResponse = await fetch(
        "http://localhost:3000/api/v1/room-categories",
        {
          method: "POST",
          body: JSON.stringify({
            name: "U1 Category",
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session1.token}`,
          },
        },
      )

      const rcCreated = await createResponse.json()

      const response = await fetch(
        `http://localhost:3000/api/v1/room-categories/${rcCreated.id}`,
        {
          method: "DELETE",
          headers: {
            Cookie: `session_id=${session2.token}`,
          },
        },
      )

      expect(response.status).toBe(204)

      const results = await database.query({
        text: `SELECT * FROM "room-categories" WHERE id = $1`,
        values: [rcCreated.id],
      })

      expect(results.rowCount).toBe(0)
    })
  })
})
