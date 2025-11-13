import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("POST /api/v1/rooms", () => {
  describe("Anonymous user", () => {
    test("Can't create rooms", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/rooms", {
        method: "POST",
      })
      expect(response1.status).toBe(401)
    })
  })
  describe("Default user'", () => {
    test("Without feature 'create:content'", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithValidSession",
      })

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const hotel = await orchestrator.createHotel(createdUser.id)
      const roomType = await orchestrator.createRoomType(createdUser.id)
      const roomCategory = await orchestrator.createRoomCategory(createdUser.id)

      const response1 = await fetch("http://localhost:3000/api/v1/rooms", {
        method: "POST",
        body: JSON.stringify({
          hotel_id: hotel.id,
          room_type_id: roomType.id,
          room_category_id: roomCategory.id,
          price_per_night: 150.0,
          total_rooms: 5,
          available_rooms: 3,
          blocked_rooms: 2,
        }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
      })

      expect(response1.status).toBe(403)
    })
    test("with blank data", async () => {
      const createdUser = await orchestrator.createUser()

      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["create:content"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch("http://localhost:3000/api/v1/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
      })

      expect(response.status).toBe(400)

      const roomCreated = await response.json()
      expect(roomCreated).toEqual({
        action: "Envie todos os campos obrigatórios e tente novamente.",
        message:
          "Campos obrigatórios ausentes: hotel_id, room_type_id, room_category_id.",
        name: "ValidationError",
        status_code: 400,
      })
    })
    test("Activated account", async () => {
      const createdUser = await orchestrator.createUser()

      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["create:content"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const hotel = await orchestrator.createHotel(createdUser.id)
      const roomType = await orchestrator.createRoomType(createdUser.id)
      const roomCategory = await orchestrator.createRoomCategory(createdUser.id)

      const response = await fetch("http://localhost:3000/api/v1/rooms", {
        method: "POST",
        body: JSON.stringify({
          hotel_id: hotel.id,
          room_type_id: roomType.id,
          room_category_id: roomCategory.id,
        }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
      })

      expect(response.status).toBe(201)

      const roomCreated = await response.json()
      expect(roomCreated).toEqual({
        id: expect.any(String),
        hotel_id: hotel.id,
        room_type_id: roomType.id,
        room_category_id: roomCategory.id,
        price_per_night: "0.00",
        total_rooms: 0,
        available_rooms: 0,
        blocked_rooms: 0,
        user_id: createdUser.id,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      })
    })

    test("With Full data", async () => {
      const createdUser = await orchestrator.createUser()

      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["create:content"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const hotel = await orchestrator.createHotel(createdUser.id)
      const roomType = await orchestrator.createRoomType(createdUser.id)
      const roomCategory = await orchestrator.createRoomCategory(createdUser.id)

      const response = await fetch("http://localhost:3000/api/v1/rooms", {
        method: "POST",
        body: JSON.stringify({
          hotel_id: hotel.id,
          room_type_id: roomType.id,
          room_category_id: roomCategory.id,
          price_per_night: 250.5,
          total_rooms: 8,
          available_rooms: 6,
          blocked_rooms: 2,
        }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
      })

      expect(response.status).toBe(201)

      const roomCreated = await response.json()
      expect(roomCreated).toEqual({
        id: expect.any(String),
        hotel_id: hotel.id,
        room_type_id: roomType.id,
        room_category_id: roomCategory.id,
        price_per_night: "250.50",
        total_rooms: 8,
        available_rooms: 6,
        blocked_rooms: 2,
        user_id: createdUser.id,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      })
    })

    test("Invalid hotel_id", async () => {
      const createdUser = await orchestrator.createUser()

      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["create:content"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const roomType = await orchestrator.createRoomType(createdUser.id)
      const roomCategory = await orchestrator.createRoomCategory(createdUser.id)

      const response = await fetch("http://localhost:3000/api/v1/rooms", {
        method: "POST",
        body: JSON.stringify({
          hotel_id: "invalid-uuid",
          room_type_id: roomType.id,
          room_category_id: roomCategory.id,
        }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
      })

      expect(response.status).toBe(400)
    })

    test("Hotel from different user", async () => {
      const user1 = await orchestrator.createUser()
      await orchestrator.activateUser(user1.id)
      await orchestrator.setUserFeatures(user1.id, ["create:content"])

      const user2 = await orchestrator.createUser()
      await orchestrator.activateUser(user2.id)
      await orchestrator.setUserFeatures(user2.id, ["create:content"])

      const session2 = await orchestrator.createSession(user2.id)

      const hotel1 = await orchestrator.createHotel(user1.id)
      const roomType2 = await orchestrator.createRoomType(user2.id)
      const roomCategory2 = await orchestrator.createRoomCategory(user2.id)

      const response = await fetch("http://localhost:3000/api/v1/rooms", {
        method: "POST",
        body: JSON.stringify({
          hotel_id: hotel1.id,
          room_type_id: roomType2.id,
          room_category_id: roomCategory2.id,
        }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session2.token}`,
        },
      })

      expect(response.status).toBe(404)
    })
  })
})
