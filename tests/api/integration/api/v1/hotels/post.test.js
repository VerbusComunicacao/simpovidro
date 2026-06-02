import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("POST /api/v1/hotels", () => {
  describe("Anonymous user", () => {
    test("Can't create hotel", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/hotels", {
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

      const response1 = await fetch("http://localhost:3000/api/v1/hotels", {
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

      const sessionObject = await orchestrator.createSession(createdUser.id)

      await orchestrator.activateAdmUser(createdUser.id)

      const response = await fetch("http://localhost:3000/api/v1/hotels", {
        method: "POST",
        body: JSON.stringify({}),
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
      })

      expect(response.status).toBe(400)

      const hotelCreated = await response.json()
      expect(hotelCreated).toEqual({
        action: "Envie todos os campos obrigatórios e tente novamente.",
        message:
          "Campos obrigatórios ausentes: name, city, country, check_in_date, check_out_date.",
        name: "ValidationError",
        status_code: 400,
      })
    })
    test("Activated account", async () => {
      const createdUser = await orchestrator.createUser()

      await orchestrator.activateAdmUser(createdUser.id)

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch("http://localhost:3000/api/v1/hotels", {
        method: "POST",
        body: JSON.stringify({
          name: "Hotel Paradise",
          city: "São Paulo",
          country: "Brasil",
          email: "hotel@paradise.com",
          check_in_date: "2026-01-07T20:43:12.021Z",
          check_out_date: "2026-01-10T20:43:12.021Z",
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
        name: "Hotel Paradise",
        city: "São Paulo",
        country: "Brasil",
        phone: null,
        state: null,
        address: null,
        check_in_date: "2026-01-07T20:43:12.021Z",
        check_out_date: "2026-01-10T20:43:12.021Z",
        email: "hotel@paradise.com",
        active: false,
        checkout_question: null,
        price_policies: [],
        user_id: createdUser.id,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      })

      //duplicate hotel name

      const response2 = await fetch("http://localhost:3000/api/v1/hotels", {
        method: "POST",
        body: JSON.stringify({
          name: "Hotel Paradise",
          city: "São Paulo",
          country: "Brasil",
          email: "hotel@paradise.com",
          check_in_date: "2026-01-07T20:43:12.021Z",
          check_out_date: "2026-01-10T20:43:12.021Z",
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
        message: "Já existe um hotel cadastrado com esse nome no sistema.",
        action:
          "O nome do hotel deve ser único globalmente. Escolha outro nome ou edite o hotel existente.",
      })
    })

    test("Other user CANNOT create with same name", async () => {
      const createdUser = await orchestrator.createUser()

      await orchestrator.activateAdmUser(createdUser.id)

      const sessionObject = await orchestrator.createSession(createdUser.id)

      // Other user tries to create with same name "Hotel Paradise"
      const response = await fetch("http://localhost:3000/api/v1/hotels", {
        method: "POST",
        body: JSON.stringify({
          name: "Hotel Paradise",
          city: "São Paulo",
          country: "Brasil",
          phone: "+55 1199993349",
          state: "São Paulo",
          address: "Av. Paraná, 1105",
          email: "hotel@paradise.com",
          check_in_date: "2026-01-07T20:43:12.021Z",
          check_out_date: "2026-01-10T20:43:12.021Z",
        }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
      })

      expect(response.status).toBe(409)

      const responseBody = await response.json()
      expect(responseBody).toEqual({
        name: "ConflictError",
        status_code: 409,
        message: "Já existe um hotel cadastrado com esse nome no sistema.",
        action:
          "O nome do hotel deve ser único globalmente. Escolha outro nome ou edite o hotel existente.",
      })
    })

    test("Create full data with success", async () => {
      const createdUser = await orchestrator.createUser()

      await orchestrator.activateAdmUser(createdUser.id)

      const sessionObject = await orchestrator.createSession(createdUser.id)

      // Other user tries to create with same name "Hotel Paradise"
      const response = await fetch("http://localhost:3000/api/v1/hotels", {
        method: "POST",
        body: JSON.stringify({
          name: "Hotel Paradise Segundo",
          city: "São Paulo",
          country: "Brasil",
          phone: "+55 1199993349",
          state: "São Paulo",
          address: "Av. Paraná, 1105",
          email: "hotel@paradise.com",
          check_in_date: "2026-01-07T20:43:12.021Z",
          check_out_date: "2026-01-10T20:43:12.021Z",
        }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
      })

      expect(response.status).toBe(201)
    })

    test("Adiciona hotel com política de idades", async () => {
      const user1 = await orchestrator.createUser()
      await orchestrator.activateUser(user1.id)
      await orchestrator.setUserFeatures(user1.id, ["create:content"])

      const session = await orchestrator.createSession(user1.id)

      const response = await fetch("http://localhost:3000/api/v1/hotels", {
        method: "POST",
        body: JSON.stringify({
          name: "Hotel Paradise Terceiro",
          city: "São Paulo",
          country: "Brasil",
          phone: "+55 1199993349",
          state: "São Paulo",
          address: "Av. Paraná, 1105",
          email: "hotel@paradise.com",
          check_in_date: "2026-01-07T20:43:12.021Z",
          check_out_date: "2026-01-10T20:43:12.021Z",
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
        }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
      })

      expect(response.status).toBe(201)
      const hotelCreated = await response.json()
      expect(hotelCreated.price_policies).toHaveLength(2)
      expect(hotelCreated.price_policies).toEqual([
        {
          id: expect.any(String),
          max_age: 3,
          description: "Criança até 3 anos não pagam",
          use_percentage: true,
          percentage: 0,
          hotel_id: hotelCreated.id,
          created_at: expect.any(String),
          updated_at: expect.any(String),
        },
        {
          id: expect.any(String),
          max_age: 12,
          description: "Criança até 12 anos não pagam",
          use_percentage: false,
          percentage: 0,
          hotel_id: hotelCreated.id,
          created_at: expect.any(String),
          updated_at: expect.any(String),
        },
      ])
    })
  })
})
