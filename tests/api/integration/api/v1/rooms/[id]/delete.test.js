import database from "infra/database"
import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("DELETE /api/v1/rooms/[id]", () => {
  describe("Anonymous user", () => {
    test("Can't delete room", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/rooms/87562c5a-7f7b-4f9e-b4de-08552758e4e9",
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

      const createdRoom = await orchestrator.createRoom(createdUser.id)

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch(
        `http://localhost:3000/api/v1/rooms/${createdRoom.id}`,
        {
          method: "DELETE",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(403)
    })

    test("Room not found", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["delete:content"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch(
        "http://localhost:3000/api/v1/rooms/87562c5a-7f7b-4f9e-b4de-08552758e4e9",
        {
          method: "DELETE",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(404)
    })

    test("Delete room successfully", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, [
        "create:content",
        "delete:content",
      ])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const roomCreated = await orchestrator.createRoom(createdUser.id, {
        price_per_night: 200.0,
        total_rooms: 5,
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/rooms/${roomCreated.id}`,
        {
          method: "DELETE",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(204)

      const results = await database.query({
        text: `SELECT * FROM "rooms" WHERE id = $1`,
        values: [roomCreated.id],
      })

      expect(results.rowCount).toBe(0)
    })

    test("Delete room from different user", async () => {
      const user1 = await orchestrator.createUser()
      await orchestrator.activateUser(user1.id)
      await orchestrator.setUserFeatures(user1.id, ["create:content"])

      const user2 = await orchestrator.createUser()
      await orchestrator.activateUser(user2.id)
      await orchestrator.setUserFeatures(user2.id, ["delete:content"])

      const session1 = await orchestrator.createSession(user1.id)
      const session2 = await orchestrator.createSession(user2.id)

      const createResponse = await fetch("http://localhost:3000/api/v1/rooms", {
        method: "POST",
        body: JSON.stringify({
          hotel_id: (await orchestrator.createHotel(user1.id)).id,
          room_type_id: (await orchestrator.createRoomType(user1.id)).id,
          room_category_id: (await orchestrator.createRoomCategory(user1.id))
            .id,
          price_per_night: 150.0,
          total_rooms: 5,
        }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session1.token}`,
        },
      })

      const roomCreated = await createResponse.json()

      const response = await fetch(
        `http://localhost:3000/api/v1/rooms/${roomCreated.id}`,
        {
          method: "DELETE",
          headers: {
            Cookie: `session_id=${session2.token}`,
          },
        },
      )

      expect(response.status).toBe(204)

      const results = await database.query({
        text: `SELECT * FROM "rooms" WHERE id = $1`,
        values: [roomCreated.id],
      })

      expect(results.rowCount).toBe(0)
    })
  })
})
