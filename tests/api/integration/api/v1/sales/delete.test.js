import orchestrator from "tests/orchestrator.js"
import sale from "models/sale.js"
import room from "models/room.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("DELETE /api/v1/sales/[id]", () => {
  describe("Anonymous user", () => {
    test("should return 401", async () => {
      const randomId = "d2a6a6a6-a6a6-a6a6-a6a6-a6a6a6a6a6a6"
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/sales/${randomId}`,
        {
          method: "DELETE",
        },
      )

      expect(response.status).toBe(401)
    })
  })

  describe("Authenticated user", () => {
    let adminToken
    let saleId
    let roomId

    beforeAll(async () => {
      // 1. Create Admin User (who has permission)
      const adminUser = await orchestrator.createUser({
        email: "admin-delete@example.com",
        password: "password123",
      })
      await orchestrator.activateAdmUser(adminUser.id)
      await orchestrator.addFeatureToUser(adminUser, ["update:content"])
      const adminSession = await orchestrator.createSession(adminUser.id)
      adminToken = adminSession.token

      // 2. Create Regular User (who creates the sale)
      const regularUser = await orchestrator.createUser({
        email: "user-delete@example.com",
        password: "password123",
      })
      await orchestrator.activateUser(regularUser.id)
      await orchestrator.createSession(regularUser.id)

      // 3. Setup Hotel and Room
      const hotel = await orchestrator.createHotel(adminUser.id)
      const roomType = await orchestrator.createRoomType(adminUser.id)
      const roomCategory = await orchestrator.createRoomCategory(adminUser.id)
      const createdRoom = await orchestrator.createRoom(adminUser.id, {
        hotel_id: hotel.id,
        room_type_id: roomType.id,
        room_category_id: roomCategory.id,
        total_rooms: 5,
        available_rooms: 5,
      })
      roomId = createdRoom.id

      // 4. Create Registration (Sale)
      const registration = await orchestrator.createRegistration(
        regularUser.id,
        {
          room_id: roomId,
        },
      )
      saleId = registration.saleId
    })

    test("should be able to cancel a sale and restore room availability", async () => {
      // 1. Check initial room availability
      const roomBefore = await room.findOneById(roomId)
      expect(roomBefore.available_rooms).toBe(4)

      // 2. Cancel the Sale
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/sales/${saleId}`,
        {
          method: "DELETE",
          headers: {
            Cookie: `session_id=${adminToken}`,
          },
        },
      )

      expect(response.status).toBe(204)

      // 3. Verify Sale Status
      const saleAfter = await sale.findOneById(saleId)
      expect(saleAfter.status).toBe("cancelled")
      expect(saleAfter.payment_status).toBe("cancelled")

      // 4. Verify Room Availability Restored
      const roomAfter = await room.findOneById(roomId)
      expect(roomAfter.available_rooms).toBe(5)
    })

    test("should return 403 if user does not have permission", async () => {
      // Create a user WITHOUT permissions
      const weakUser = await orchestrator.createUser()
      await orchestrator.activateUser(weakUser.id)
      const weakSession = await orchestrator.createSession(weakUser.id)

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/sales/${saleId}`,
        {
          method: "DELETE",
          headers: {
            Cookie: `session_id=${weakSession.token}`,
          },
        },
      )

      // Expect 403 Forbidden because of ForbiddenError in controller
      expect(response.status).toBe(403)
    })
  })
})
