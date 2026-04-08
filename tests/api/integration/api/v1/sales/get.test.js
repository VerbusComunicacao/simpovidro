import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("GET /api/v1/sales", () => {
  describe("Anonymous user", () => {
    test("Should return 400", async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sales`)
      expect(response.status).toBe(400)
    })
  })

  describe("Default user", () => {
    test("Should return 400 if user does not have permission", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/sales`,
        {
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )
      expect(response.status).toBe(400)
    })
  })

  describe("Admin user", () => {
    test("Should return all sales by default and filter when requested", async () => {
      // 1. Setup Admin User
      const adminUser = await orchestrator.createUser()
      await orchestrator.activateAdmUser(adminUser.id)
      await orchestrator.addFeatureToUser(adminUser, [
        "read:content",
        "update:content",
      ])
      // update:content needed to cancel
      const sessionObject = await orchestrator.createSession(adminUser.id)

      // 2. Setup Resources
      const hotel = await orchestrator.createHotel(adminUser.id)
      const roomType = await orchestrator.createRoomType(adminUser.id)
      const roomCategory = await orchestrator.createRoomCategory(adminUser.id)

      const room1 = await orchestrator.createRoom(adminUser.id, {
        hotel_id: hotel.id,
        room_type_id: roomType.id,
        room_category_id: roomCategory.id,
        available_rooms: 10,
      })

      const room2 = await orchestrator.createRoom(adminUser.id, {
        hotel_id: hotel.id,
        room_type_id: roomType.id,
        room_category_id: roomCategory.id,
        available_rooms: 10,
      })

      // 3. Create Sales
      // Sale 1 (Active)
      const guestUser1 = await orchestrator.createUser()
      await orchestrator.activateUser(guestUser1.id)
      const reg1 = await orchestrator.createRegistration(guestUser1.id, {
        room_id: room1.id,
      })
      const sale1Id = reg1.saleId

      // Sale 2 (Cancelled)
      const guestUser2 = await orchestrator.createUser()
      await orchestrator.activateUser(guestUser2.id)
      const reg2 = await orchestrator.createRegistration(guestUser2.id, {
        room_id: room2.id,
      })
      const sale2Id = reg2.saleId

      // Cancel Sale 2
      const cancelResponse = await fetch(
        `${orchestrator.webserverUrl}/api/v1/sales/${sale2Id}`,
        {
          method: "DELETE",
          headers: { Cookie: `session_id=${sessionObject.token}` },
        },
      )
      expect(cancelResponse.status).toBe(204)

      // 4. Test Default (Show All)
      const responseAll = await fetch(
        `${orchestrator.webserverUrl}/api/v1/sales`,
        {
          headers: { Cookie: `session_id=${sessionObject.token}` },
        },
      )
      expect(responseAll.status).toBe(200)
      const allSales = await responseAll.json()

      const allIds = allSales.map((s) => s.id)
      expect(allIds).toContain(sale1Id)
      expect(allIds).toContain(sale2Id)

      // 5. Test Filtered (Hide Cancelled)
      const responseFiltered = await fetch(
        `${orchestrator.webserverUrl}/api/v1/sales?hide_cancelled=true`,
        {
          headers: { Cookie: `session_id=${sessionObject.token}` },
        },
      )
      expect(responseFiltered.status).toBe(200)
      const filteredSales = await responseFiltered.json()

      const filteredIds = filteredSales.map((s) => s.id)
      expect(filteredIds).toContain(sale1Id)
      expect(filteredIds).not.toContain(sale2Id)
    })
  })
})
