import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("PATCH /api/v1/rooms/[id]", () => {
  describe("Anonymous user", () => {
    test("Can't update room", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/rooms/780a77f5-6fca-4e95-bc6c-e93e889cba80",
        {
          method: "PATCH",
        },
      )
      expect(response.status).toBe(401)
    })
  })

  describe("Authenticated user", () => {
    test("Without feature 'update:content'", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithoutUpdateFeature",
      })

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch(
        "http://localhost:3000/api/v1/rooms/780a77f5-6fca-4e95-bc6c-e93e889cba80",
        {
          method: "PATCH",
          body: JSON.stringify({
            price_per_night: 200.0,
            total_rooms: 6,
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(403)
    })

    test("Room not found", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["update:content"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch(
        "http://localhost:3000/api/v1/rooms/87562c5a-7f7b-4f9e-b4de-08552758e4e9",
        {
          method: "PATCH",
          body: JSON.stringify({
            price_per_night: 200.0,
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(404)
    })

    test("Update room with blank data", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, [
        "create:content",
        "update:content",
      ])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const created = await orchestrator.createRoom(createdUser.id, {
        price_per_night: 150.0,
        total_rooms: 5,
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/rooms/${created.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(400)

      const errorBody = await response.json()
      expect(errorBody).toEqual({
        action: "Envie algum campo e tente novamente.",
        message: `Nenhum campo enviado para atualização.`,
        name: "ValidationError",
        status_code: 400,
      })
    })

    test("Update room successfully", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, [
        "create:content",
        "update:content",
      ])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const hotel = await orchestrator.createHotel(createdUser.id)
      const roomType = await orchestrator.createRoomType(createdUser.id)
      const roomCategory = await orchestrator.createRoomCategory(createdUser.id)

      const created = await orchestrator.createRoom(createdUser.id, {
        hotel_id: hotel.id,
        room_type_id: roomType.id,
        room_category_id: roomCategory.id,
        price_per_night: 150.0,
        total_rooms: 5,
        blocked_rooms: 2,
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/rooms/${created.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            price_per_night: 200.0,
            total_rooms: 8,
            available_rooms: 6,
            blocked_rooms: 2,
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(200)

      const updated = await response.json()
      expect(updated).toEqual({
        id: created.id,
        hotel_id: created.hotel_id,
        name: null,
        description: null,
        photos: [],
        room_type_id: created.room_type_id,
        room_category_id: created.room_category_id,
        price_per_night: "200.00",
        price_policies: [],
        total_rooms: 8,
        available_rooms: 6,
        blocked_rooms: 2,
        user_id: createdUser.id,
        created_at: created.created_at.toISOString(),
        updated_at: expect.any(String),
        hotel_name: hotel.name,
        hotel_check_in_date: hotel.check_in_date.toISOString(),
        hotel_check_out_date: hotel.check_out_date.toISOString(),
        room_type: roomType.name,
        room_category: roomCategory.name,
        max_adults: roomCategory.max_adults,
        max_children: roomCategory.max_children,
        member_price_per_night: "0.00",
      })
    })

    test("Update room with invalid hotel_id", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, [
        "create:content",
        "update:content",
      ])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const created = await orchestrator.createRoom(createdUser.id)

      const response = await fetch(
        `http://localhost:3000/api/v1/rooms/${created.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            hotel_id: "invalid-uuid",
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(400)
    })

    test("Update room with hotel from different user", async () => {
      const user1 = await orchestrator.createUser()
      await orchestrator.activateUser(user1.id)
      await orchestrator.setUserFeatures(user1.id, ["create:content"])

      const user2 = await orchestrator.createUser()
      await orchestrator.activateUser(user2.id)
      await orchestrator.setUserFeatures(user2.id, [
        "create:content",
        "update:content",
      ])

      const session2 = await orchestrator.createSession(user2.id)

      const hotel1 = await orchestrator.createHotel(user1.id)
      const room2 = await orchestrator.createRoom(user2.id)

      const response = await fetch(
        `http://localhost:3000/api/v1/rooms/${room2.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            hotel_id: hotel1.id,
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session2.token}`,
          },
        },
      )

      expect(response.status).toBe(404)
    })

    test("Only total_rooms provided adjusts available", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["update:content"])
      const sessionObject = await orchestrator.createSession(createdUser.id)

      const hotel = await orchestrator.createHotel(createdUser.id)
      const roomType = await orchestrator.createRoomType(createdUser.id)
      const roomCategory = await orchestrator.createRoomCategory(createdUser.id)

      const roomCreated = await orchestrator.createRoom(createdUser.id, {
        hotel_id: hotel.id,
        room_type_id: roomType.id,
        room_category_id: roomCategory.id,
        total_rooms: 5,
        available_rooms: 3,
        blocked_rooms: 2,
      })

      const patchResponse = await fetch(
        `http://localhost:3000/api/v1/rooms/${roomCreated.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ total_rooms: 12 }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(patchResponse.status).toBe(200)
      const roomUpdated = await patchResponse.json()
      expect(roomUpdated).toEqual({
        id: roomCreated.id,
        hotel_id: hotel.id,
        name: null,
        description: null,
        photos: [],
        room_type_id: roomType.id,
        room_category_id: roomCategory.id,
        price_per_night: roomCreated.price_per_night,
        price_policies: [],
        total_rooms: 12,
        available_rooms: 10,
        blocked_rooms: 2,
        user_id: createdUser.id,
        created_at: expect.any(String),
        updated_at: expect.any(String),
        hotel_name: hotel.name,
        hotel_check_in_date: hotel.check_in_date.toISOString(),
        hotel_check_out_date: hotel.check_out_date.toISOString(),
        room_type: roomType.name,
        room_category: roomCategory.name,
        max_adults: roomCategory.max_adults,
        max_children: roomCategory.max_children,
        member_price_per_night: "0.00",
      })

      const patchResponse2 = await fetch(
        `http://localhost:3000/api/v1/rooms/${roomCreated.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ total_rooms: 2 }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(patchResponse2.status).toBe(200)
      const roomUpdated2 = await patchResponse2.json()
      expect(roomUpdated2).toEqual({
        id: roomCreated.id,
        hotel_id: hotel.id,
        name: null,
        description: null,
        photos: [],
        room_type_id: roomType.id,
        room_category_id: roomCategory.id,
        price_per_night: roomCreated.price_per_night,
        price_policies: [],
        total_rooms: 2,
        available_rooms: 0,
        blocked_rooms: 2,
        user_id: createdUser.id,
        created_at: expect.any(String),
        updated_at: expect.any(String),
        hotel_name: hotel.name,
        hotel_check_in_date: hotel.check_in_date.toISOString(),
        hotel_check_out_date: hotel.check_out_date.toISOString(),
        room_type: roomType.name,
        room_category: roomCategory.name,
        max_adults: roomCategory.max_adults,
        max_children: roomCategory.max_children,
        member_price_per_night: "0.00",
      })

      const patchResponse3 = await fetch(
        `http://localhost:3000/api/v1/rooms/${roomCreated.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ total_rooms: 1 }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(patchResponse3.status).toBe(400)
      const roomUpdated3 = await patchResponse3.json()
      expect(roomUpdated3).toEqual({
        name: "ValidationError",
        status_code: 400,
        message:
          "O novo total/bloqueio de quartos é insuficiente para as vendas já realizadas.",
        action: "Aumente o total de quartos ou diminua os bloqueados.",
      })
    })

    test("Negative values are rejected", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["update:content"])
      const sessionObject = await orchestrator.createSession(createdUser.id)

      const hotel = await orchestrator.createHotel(createdUser.id)
      const roomType = await orchestrator.createRoomType(createdUser.id)
      const roomCategory = await orchestrator.createRoomCategory(createdUser.id)

      const roomCreated = await orchestrator.createRoom(createdUser.id, {
        hotel_id: hotel.id,
        room_type_id: roomType.id,
        room_category_id: roomCategory.id,
        total_rooms: 5,
        available_rooms: 5,
        blocked_rooms: 0,
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/rooms/${roomCreated.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ available_rooms: -1 }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(400)
      const errorBody = await response.json()
      expect(errorBody).toEqual({
        name: "ValidationError",
        status_code: 400,
        message: expect.stringContaining("diverge do calculado pelo sistema"),
        action:
          "Permita que o sistema calcule a disponibilidade automaticamente.",
      })
    })

    test("Sum available + blocked must equal total", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["update:content"])
      const sessionObject = await orchestrator.createSession(createdUser.id)

      const hotel = await orchestrator.createHotel(createdUser.id)
      const roomType = await orchestrator.createRoomType(createdUser.id)
      const roomCategory = await orchestrator.createRoomCategory(createdUser.id)

      const roomCreated = await orchestrator.createRoom(createdUser.id, {
        hotel_id: hotel.id,
        room_type_id: roomType.id,
        room_category_id: roomCategory.id,
        total_rooms: 5,
        available_rooms: 3,
        blocked_rooms: 2,
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/rooms/${roomCreated.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            available_rooms: 2,
            blocked_rooms: 1,
            total_rooms: 2,
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(400)
      const errorBody = await response.json()
      expect(errorBody).toEqual({
        name: "ValidationError",
        status_code: 400,
        message: expect.stringContaining("diverge do calculado pelo sistema"),
        action:
          "Permita que o sistema calcule a disponibilidade automaticamente.",
      })
    })

    test("availability should update correctly with sales and prevent divergent overrides", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateAdmUser(createdUser.id)
      const sessionObject = await orchestrator.createSession(createdUser.id)

      // 1. Create Room with 10 total rooms
      const roomCreated = await orchestrator.createRoom(createdUser.id, {
        total_rooms: 10,
        available_rooms: 10,
        blocked_rooms: 0,
      })

      // 2. Register 5 sales
      for (let i = 0; i < 5; i++) {
        await orchestrator.createRegistration(createdUser.id, {
          room_id: roomCreated.id,
        })
      }

      // 3. Alter total_rooms from 10 to 8
      const patchResponse = await fetch(
        `http://localhost:3000/api/v1/rooms/${roomCreated.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ total_rooms: 8, blocked_rooms: 1 }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(patchResponse.status).toBe(200)
      const roomUpdated = await patchResponse.json()

      // 4. Verify availability is 3 (8 total - 0 blocked - 5 sales = 3)
      expect(roomUpdated.available_rooms).toBe(2)
      expect(roomUpdated.total_rooms).toBe(8)

      // 5. Try to alter available_rooms to 4 (divergent)
      const patchResponse2 = await fetch(
        `http://localhost:3000/api/v1/rooms/${roomCreated.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ available_rooms: 4 }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      // 6. Must fail and not permit
      expect(patchResponse2.status).toBe(400)
      const errorBody = await patchResponse2.json()
      expect(errorBody.name).toBe("ValidationError")
      expect(errorBody.message).toContain("diverge do calculado pelo sistema")
    })
  })
})
