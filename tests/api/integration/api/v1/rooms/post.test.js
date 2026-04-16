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
          "Campos obrigatórios ausentes: hotel_id, room_type_id, room_category_id, price_per_night, total_rooms.",
        name: "ValidationError",
        status_code: 400,
      })
    })
    test("Activated account with feature 'create:content'", async () => {
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

      expect(response.status).toBe(400)

      const responseBody = await response.json()
      expect(responseBody).toEqual({
        action: "Envie todos os campos obrigatórios e tente novamente.",
        message: "Campos obrigatórios ausentes: price_per_night, total_rooms.",
        name: "ValidationError",
        status_code: 400,
      })
    })

    test("return available_rooms equal to total_rooms", async () => {
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
          total_rooms: 6,
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
        name: null,
        description: null,
        photos: [],
        room_type_id: roomType.id,
        room_category_id: roomCategory.id,
        price_per_night: "250.50",
        price_policies: [],
        total_rooms: 6,
        available_rooms: 6,
        blocked_rooms: 0,
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
        min_guests: 1,
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
          price_per_night: 250.5,
          total_rooms: 6,
        }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session2.token}`,
        },
      })

      expect(response.status).toBe(201)
    })

    test("Cria um quarto com base em políticas de idade existentes", async () => {
      const user1 = await orchestrator.createUser()
      await orchestrator.activateAdmUser(user1.id)
      const session = await orchestrator.createSession(user1.id)

      const hotel = await orchestrator.createHotel(user1.id, {
        price_policies: [
          {
            max_age: 3,
            description: "Criança até 3 anos não pagam",
            use_percentage: true,
          },
          {
            max_age: 12,
            description: "Criança até 12 anos não pagam",
            use_percentage: false,
          },
        ],
      })

      const roomType = await orchestrator.createRoomType(user1.id)
      const roomCategory = await orchestrator.createRoomCategory(user1.id)

      const response = await fetch("http://localhost:3000/api/v1/rooms", {
        method: "POST",
        body: JSON.stringify({
          hotel_id: hotel.id,
          room_type_id: roomType.id,
          room_category_id: roomCategory.id,
          price_per_night: 250.5,
          member_price_per_night: 200.5,
          total_rooms: 6,
          price_policies: [
            {
              id: hotel.price_policies[1].id,
              price: 50,
            },
          ],
        }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
      })

      expect(response.status).toBe(201)
    })
  })
})
