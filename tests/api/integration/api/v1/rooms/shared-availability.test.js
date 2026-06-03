import orchestrator from "tests/orchestrator.js"
import sale from "models/sale.js"
import guest from "models/guest.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("Shared Room Availability (Parent-Child Inheritance)", () => {
  test("Child room should inherit values from parent, sync availability, and prevent invalid overrides", async () => {
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
    const categoryParent = await orchestrator.createRoomCategory(
      createdUser.id,
      { name: "Luxo Single" },
    )
    const categoryChild = await orchestrator.createRoomCategory(
      createdUser.id,
      { name: "Luxo Duplo" },
    )

    // 1. Create Parent Room (with 5 total rooms)
    const parentRoom = await orchestrator.createRoom(createdUser.id, {
      hotel_id: hotel.id,
      room_type_id: roomType.id,
      room_category_id: categoryParent.id,
      total_rooms: 5,
      available_rooms: 5,
      blocked_rooms: 0,
      name: "Quarto Master Luxo",
      price_per_night: 150.0,
      member_price_per_night: 120.0,
    })

    expect(parentRoom.available_rooms).toBe(5)

    // 2. Create Child Room (linked to parent)
    const childRoom = await orchestrator.createRoom(createdUser.id, {
      hotel_id: hotel.id,
      room_type_id: roomType.id,
      room_category_id: categoryChild.id,
      parent_room_id: parentRoom.id,
      price_per_night: 220.0,
      member_price_per_night: 180.0,
      min_guests: 2,
    })

    // Child room should inherit stock and general info from parent
    expect(childRoom.total_rooms).toBe(5)
    expect(childRoom.available_rooms).toBe(5)
    expect(childRoom.name).toBe("Quarto Master Luxo")

    // Child room should override categories and prices
    expect(childRoom.room_category_id).toBe(categoryChild.id)
    expect(childRoom.price_per_night).toBe("220.00")
    expect(childRoom.min_guests).toBe(2)

    // 3. Create guest and booking on the child room
    const guest1 = await guest.create(
      {
        name: "Hospede 1",
        badge_name: "Cracha 1",
        email: "hospede1@example.com",
        phone: "11999999999",
        gender: "M",
        rg_number: "123456789",
        cpf_number: "12345678901",
        birth_date: "1990-05-05",
      },
      createdUser.id,
    )

    const guest2 = await guest.create(
      {
        name: "Hospede 2",
        badge_name: "Cracha 2",
        email: "hospede2@example.com",
        phone: "11988888888",
        gender: "F",
        rg_number: "987654321",
        cpf_number: "98765432109",
        birth_date: "1993-08-08",
      },
      createdUser.id,
    )

    const sale1 = await sale.create({
      guest_ids: [guest1.id, guest2.id],
      room_id: childRoom.id,
    })

    // 4. Verify availability decreased to 4 on BOTH rooms
    const parentResponse = await fetch(
      `http://localhost:3000/api/v1/rooms/${parentRoom.id}`,
      {
        headers: { Cookie: `session_id=${sessionObject.token}` },
      },
    ).then((r) => r.json())

    const childResponse = await fetch(
      `http://localhost:3000/api/v1/rooms/${childRoom.id}`,
      {
        headers: { Cookie: `session_id=${sessionObject.token}` },
      },
    ).then((r) => r.json())

    expect(parentResponse.available_rooms).toBe(4)
    expect(childResponse.available_rooms).toBe(4)

    // 5. Attempt to update total_rooms on the child room should fail
    const updateChildResponse = await fetch(
      `http://localhost:3000/api/v1/rooms/${childRoom.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ total_rooms: 8 }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
      },
    )
    expect(updateChildResponse.status).toBe(400)
    const errBody = await updateChildResponse.json()
    expect(errBody.message).toContain(
      "Este quarto é um quarto filho e herda a disponibilidade do quarto pai",
    )

    // 6. Update total_rooms on parent room
    const updateParentResponse = await fetch(
      `http://localhost:3000/api/v1/rooms/${parentRoom.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ total_rooms: 8 }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
      },
    )
    expect(updateParentResponse.status).toBe(200)

    // Fetch and check that BOTH updated their capacity
    const parentResponse2 = await fetch(
      `http://localhost:3000/api/v1/rooms/${parentRoom.id}`,
      {
        headers: { Cookie: `session_id=${sessionObject.token}` },
      },
    ).then((r) => r.json())

    const childResponse2 = await fetch(
      `http://localhost:3000/api/v1/rooms/${childRoom.id}`,
      {
        headers: { Cookie: `session_id=${sessionObject.token}` },
      },
    ).then((r) => r.json())

    // 8 total - 0 blocked - 1 sale = 7 available
    expect(parentResponse2.total_rooms).toBe(8)
    expect(parentResponse2.available_rooms).toBe(7)

    expect(childResponse2.total_rooms).toBe(8)
    expect(childResponse2.available_rooms).toBe(7)

    // 7. Cancel the sale and verify availability returns to 8
    await sale.cancel(sale1.id)

    const parentResponse3 = await fetch(
      `http://localhost:3000/api/v1/rooms/${parentRoom.id}`,
      {
        headers: { Cookie: `session_id=${sessionObject.token}` },
      },
    ).then((r) => r.json())

    const childResponse3 = await fetch(
      `http://localhost:3000/api/v1/rooms/${childRoom.id}`,
      {
        headers: { Cookie: `session_id=${sessionObject.token}` },
      },
    ).then((r) => r.json())

    expect(parentResponse3.available_rooms).toBe(8)
    expect(childResponse3.available_rooms).toBe(8)
  })
})
