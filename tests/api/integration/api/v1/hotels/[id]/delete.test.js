import database from "infra/database"
import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("DELETE /api/v1/hotels/[id]", () => {
  describe("Anonymous user", () => {
    test("Can't delete hotel", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/hotels/87562c5a-7f7b-4f9e-b4de-08552758e4e9",
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

      const createdHotel = await orchestrator.createHotel(createdUser.id)

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch(
        `http://localhost:3000/api/v1/hotels/${createdHotel.id}`,
        {
          method: "DELETE",
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
          method: "DELETE",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(404)
    })

    test("Delete hotel successfully", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateAccount(createdUser.id)

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const hotelCreated = await orchestrator.createHotel(createdUser.id, {
        name: "Hotel to Delete",
        city: "São Paulo",
        country: "Brasil",
        email: "delete@hotel.com",
      })

      // Delete the hotel
      const response = await fetch(
        `http://localhost:3000/api/v1/hotels/${hotelCreated.id}`,
        {
          method: "DELETE",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(204)

      // Verify hotel was deleted
      const results = await database.query({
        text: `SELECT * FROM hotels WHERE id = $1`,
        values: [hotelCreated.id],
      })

      expect(results.rowCount).toBe(0)
    })

    test("Delete hotel from different user", async () => {
      const user1 = await orchestrator.createUser()
      await orchestrator.activateAccount(user1.id)

      const user2 = await orchestrator.createUser()
      await orchestrator.activateAccount(user2.id)

      const session1 = await orchestrator.createSession(user1.id)
      const session2 = await orchestrator.createSession(user2.id)

      // User 1 creates a hotel
      const createResponse = await fetch(
        "http://localhost:3000/api/v1/hotels",
        {
          method: "POST",
          body: JSON.stringify({
            name: "User 1 Hotel",
            city: "São Paulo",
            country: "Brasil",
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session1.token}`,
          },
        },
      )

      const hotelCreated = await createResponse.json()

      // User 2 tries to delete User 1's hotel
      const response = await fetch(
        `http://localhost:3000/api/v1/hotels/${hotelCreated.id}`,
        {
          method: "DELETE",
          headers: {
            Cookie: `session_id=${session2.token}`,
          },
        },
      )

      expect(response.status).toBe(403)
    })
  })
})
