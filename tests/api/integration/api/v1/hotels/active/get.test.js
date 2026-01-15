import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("GET /api/v1/hotels/active", () => {
  describe("Anonymous user", () => {
    test("Can list active hotels with details", async () => {
      const adminUser = await orchestrator.createUser()
      await orchestrator.activateAdmUser(adminUser.id)

      // Create active hotel with room
      const hotel = await orchestrator.createHotel(adminUser.id, {
        name: "Hotel Ativo",
      })
      await orchestrator.activateHotel(hotel.id)

      const roomType = await orchestrator.createRoomType(adminUser.id, {
        name: "Suite",
      })
      const roomCategory = await orchestrator.createRoomCategory(adminUser.id, {
        name: "Deluxe",
      })

      await orchestrator.createRoom(adminUser.id, {
        hotel_id: hotel.id,
        room_type_id: roomType.id,
        room_category_id: roomCategory.id,
        price_per_night: 200,
        available_rooms: 5,
      })

      // Create inactive hotel
      await orchestrator.createHotel(adminUser.id, {
        name: "Hotel Inativo",
        active: false,
      })

      const response = await fetch("http://localhost:3000/api/v1/hotels/active")

      expect(response.status).toBe(200)

      const hotelsList = await response.json()

      expect(hotelsList).toHaveLength(1)
      expect(hotelsList[0].name).toBe("Hotel Ativo")

      // Verify nested rooms data
      expect(hotelsList[0].rooms).toHaveLength(1)
      const room = hotelsList[0].rooms[0]
      expect(room.price_per_night).toBe(200)
      expect(room.room_type).toBe("Suite")
      expect(room.room_category).toBe("Deluxe")
    })
  })
})
