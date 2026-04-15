import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("POST /api/v1/room-types", () => {
  describe("Anonymous user", () => {
    test("Can't create room-types", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/room-types", {
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

      const response1 = await fetch("http://localhost:3000/api/v1/room-types", {
        method: "POST",
        body: JSON.stringify({
          name: "Resort",
          city: "Rio de Janeiro",
          email: "resort@resort.com",
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

      const response = await fetch("http://localhost:3000/api/v1/room-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
      })

      expect(response.status).toBe(400)

      const hotelCreated = await response.json()
      expect(hotelCreated).toEqual({
        action: "Envie todos os campos obrigatórios e tente novamente.",
        message: "Campos obrigatórios ausentes: name.",
        name: "ValidationError",
        status_code: 400,
      })
    })
    test("Activated account", async () => {
      const createdUser = await orchestrator.createUser()

      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["create:content"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch("http://localhost:3000/api/v1/room-types", {
        method: "POST",
        body: JSON.stringify({
          name: "Room Type 1",
        }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
      })

      expect(response.status).toBe(201)

      const hotelCreated = await response.json()
      expect(hotelCreated).toEqual({
        id: expect.any(String),
        name: "Room Type 1",
        description: null,
        user_id: createdUser.id,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      })

      //duplicate hotel name

      const response2 = await fetch("http://localhost:3000/api/v1/room-types", {
        method: "POST",
        body: JSON.stringify({
          name: "Room Type 1",
        }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
      })

      expect(response2.status).toEqual(409)
      const responseBody2 = await response2.json()

      expect(responseBody2).toEqual({
        name: "ConflictError",
        status_code: 409,
        message:
          "Já existe um tipo de quarto cadastrado com esse nome no sistema.",
        action:
          "O nome deve ser globalmente único. Escolha outro nome ou edite o tipo de quarto existente.",
      })
    })

    test("With Full data", async () => {
      const createdUser = await orchestrator.createUser()

      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["create:content"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      // Other user can create with same name
      const response = await fetch("http://localhost:3000/api/v1/room-types", {
        method: "POST",
        body: JSON.stringify({
          name: "Room Type 2",
          description: "Room Type 2 description",
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
        name: "Room Type 2",
        description: "Room Type 2 description",
        user_id: createdUser.id,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      })
    })
  })
})
