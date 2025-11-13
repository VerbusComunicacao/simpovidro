import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("POST /api/v1/room-categories", () => {
  describe("Anonymous user", () => {
    test("Can't create room-categories", async () => {
      const response1 = await fetch(
        "http://localhost:3000/api/v1/room-categories",
        {
          method: "POST",
        },
      )
      expect(response1.status).toBe(401)
    })
  })
  describe("Default user'", () => {
    test("Without feature 'create:content'", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithValidSession",
      })

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response1 = await fetch(
        "http://localhost:3000/api/v1/room-categories",
        {
          method: "POST",
          body: JSON.stringify({
            name: "Standard",
            max_adults: 2,
            max_children: 1,
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response1.status).toBe(403)
    })
    test("with blank data", async () => {
      const createdUser = await orchestrator.createUser()

      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["create:content"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch(
        "http://localhost:3000/api/v1/room-categories",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(400)

      const categoryCreated = await response.json()
      expect(categoryCreated).toEqual({
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

      const response = await fetch(
        "http://localhost:3000/api/v1/room-categories",
        {
          method: "POST",
          body: JSON.stringify({
            name: "Room Category 1",
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(201)

      const categoryCreated = await response.json()
      expect(categoryCreated).toEqual({
        id: expect.any(String),
        name: "Room Category 1",
        max_adults: 1,
        max_children: 0,
        user_id: createdUser.id,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      })

      //duplicate category name

      const response2 = await fetch(
        "http://localhost:3000/api/v1/room-categories",
        {
          method: "POST",
          body: JSON.stringify({
            name: "Room Category 1",
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response2.status).toEqual(409)
      const responseBody2 = await response2.json()

      expect(responseBody2).toEqual({
        name: "ConflictError",
        status_code: 409,
        message:
          "Já existe uma categoria de quarto cadastrada com esse nome para este usuário.",
        action: "Escolha outro nome ou edite a categoria de quarto existente.",
      })
    })

    test("With Full data", async () => {
      const createdUser = await orchestrator.createUser()

      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["create:content"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      // Other user can create with same name
      const response = await fetch(
        "http://localhost:3000/api/v1/room-categories",
        {
          method: "POST",
          body: JSON.stringify({
            name: "Room Category 2",
            max_adults: 3,
            max_children: 2,
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(201)

      const categoryCreated = await response.json()
      expect(categoryCreated).toEqual({
        id: expect.any(String),
        name: "Room Category 2",
        max_adults: 3,
        max_children: 2,
        user_id: createdUser.id,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      })
    })
  })
})
