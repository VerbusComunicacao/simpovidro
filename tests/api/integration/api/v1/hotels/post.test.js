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
        message:
          "Já existe um hotel cadastrado com esse nome para este usuário.",
        action: "Escolha outro nome ou edite o hotel existente.",
      })
    })

    test("With Full data", async () => {
      const createdUser = await orchestrator.createUser()

      await orchestrator.activateAdmUser(createdUser.id)

      const sessionObject = await orchestrator.createSession(createdUser.id)

      // Other user can create with same name
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

      expect(response.status).toBe(201)

      const hotelCreated = await response.json()
      expect(hotelCreated).toEqual({
        id: expect.any(String),
        name: "Hotel Paradise",
        city: "São Paulo",
        country: "Brasil",
        phone: "+55 1199993349",
        state: "São Paulo",
        address: "Av. Paraná, 1105",
        email: "hotel@paradise.com",
        check_in_date: "2026-01-07T20:43:12.021Z",
        check_out_date: "2026-01-10T20:43:12.021Z",
        active: false,
        price_policies: [],
        user_id: createdUser.id,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      })
    })
  })
})
