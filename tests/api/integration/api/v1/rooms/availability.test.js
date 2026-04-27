import orchestrator from "tests/orchestrator.js"
import sale from "models/sale.js"
import guest from "models/guest.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("Room Availability (Source of Truth)", () => {
  test("Updating room should preserve availability based on sales", async () => {
    const createdUser = await orchestrator.createUser()
    await orchestrator.activateUser(createdUser.id)
    await orchestrator.setUserFeatures(createdUser.id, [
      "create:content",
      "update:content",
      "read:content",
    ])

    const sessionObject = await orchestrator.createSession(createdUser.id)

    const hotel = await orchestrator.createHotel(createdUser.id)
    const roomType = await orchestrator.createRoomType(createdUser.id)
    const roomCategory = await orchestrator.createRoomCategory(createdUser.id)

    // 1. Create a room with 10 total rooms
    const roomCreated = await orchestrator.createRoom(createdUser.id, {
      hotel_id: hotel.id,
      room_type_id: roomType.id,
      room_category_id: roomCategory.id,
      total_rooms: 10,
      available_rooms: 10,
      blocked_rooms: 0,
    })

    expect(roomCreated.available_rooms).toBe(10)

    // 2. Create 2 guest and 2 sales
    const guest1 = await guest.create(
      {
        name: "Guest 1",
        badge_name: "Crachá 1",
        email: "guest1@example.com",
        phone: "11999999999",
        gender: "M",
        rg_number: "111111111",
        cpf_number: "11111111111",
        birth_date: "1990-01-01",
      },
      createdUser.id,
    )

    const guest2 = await guest.create(
      {
        name: "Guest 2",
        badge_name: "Crachá 2",
        email: "guest2@example.com",
        phone: "11888888888",
        gender: "F",
        rg_number: "222222222",
        cpf_number: "22222222222",
        birth_date: "1992-02-02",
      },
      createdUser.id,
    )

    await sale.create({
      guest_ids: [guest1.id],
      room_id: roomCreated.id,
    })

    await sale.create({
      guest_ids: [guest2.id],
      room_id: roomCreated.id,
    })

    // Verify availability decreased
    const roomAfterSales = await fetch(
      `http://localhost:3000/api/v1/rooms/${roomCreated.id}`,
      {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      },
    ).then((r) => r.json())

    expect(roomAfterSales.available_rooms).toBe(8)

    // 3. Update room (e.g., change price or even total_rooms)
    // The bug was: if we update and put total_rooms: 10, it would reset available to 10 (ignoring the 2 sales)
    const patchResponse = await fetch(
      `http://localhost:3000/api/v1/rooms/${roomCreated.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          price_per_night: 250.0,
          total_rooms: 10,
        }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
      },
    )

    expect(patchResponse.status).toBe(200)
    const roomUpdated = await patchResponse.json()

    // It should STILL be 8, because 10 total - 0 blocked - 2 sales = 8 available
    expect(roomUpdated.available_rooms).toBe(8)
    expect(roomUpdated.total_rooms).toBe(10)

    // 4. Test increasing total rooms
    const patchResponse2 = await fetch(
      `http://localhost:3000/api/v1/rooms/${roomCreated.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          total_rooms: 15,
        }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
      },
    )
    const roomUpdated2 = await patchResponse2.json()
    // 15 total - 0 blocked - 2 sales = 13 available
    expect(roomUpdated2.available_rooms).toBe(13)

    // 5. Test blocking rooms
    const patchResponse3 = await fetch(
      `http://localhost:3000/api/v1/rooms/${roomCreated.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          blocked_rooms: 5,
        }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
      },
    )
    const roomUpdated3 = await patchResponse3.json()
    // 15 total - 5 blocked - 2 sales = 8 available
    expect(roomUpdated3.available_rooms).toBe(8)

    // 6. Test invalid state (total too low for sales + blocked)
    const patchResponse4 = await fetch(
      `http://localhost:3000/api/v1/rooms/${roomCreated.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          total_rooms: 6, // 2 sales + 5 blocked = 7 required
        }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
      },
    )
    expect(patchResponse4.status).toBe(400)
    const errorBody = await patchResponse4.json()
    expect(errorBody.message).toBe(
      "O novo total/bloqueio de quartos é insuficiente para as vendas já realizadas.",
    )
  })
})
