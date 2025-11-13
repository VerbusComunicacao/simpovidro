import { version as uuidVersion } from "uuid"
import orchestrator from "tests/orchestrator.js"
import guest from "models/guest.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("POST /api/v1/guests", () => {
  describe("Anonymous user", () => {
    test("Should return 401 Unauthorized", async () => {
      const response = await fetch("http://localhost:3000/api/v1/guests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Test Guest",
          email: "test@example.com",
          phone: "+5511999999999",
          gender: "Male",
          rg_number: "123456789",
          cpf_number: "123.456.789-00",
          birth_date: "1990-01-01",
        }),
      })

      expect(response.status).toBe(401)
    })
  })
  describe("Default user", () => {
    test("With unique and valid data", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.setUserFeatures(createdUser.id, ["create:guest"])
      await orchestrator.activateUser(createdUser.id)

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch("http://localhost:3000/api/v1/guests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          name: "Test Guest",
          email: "test@example.com",
          phone: "+5511999999999",
          gender: "Male",
          rg_number: "123456789",
          cpf_number: "123.456.789-00",
          birth_date: "1990-01-01",
        }),
      })

      const responseBody = await response.json()

      expect(response.status).toBe(201)

      expect(responseBody).toEqual({
        id: responseBody.id,
        name: "Test Guest",
        email: "test@example.com",
        phone: "+5511999999999",
        badge_name: null,
        gender: "Male",
        rg_number: "123456789",
        cpf_number: "123.456.789-00",
        passport_number: null,
        medication_details: null,
        blood_type: null,
        blood_rh_factor: null,
        health_observations: null,
        special_needs_details: null,
        has_heart_condition: false,
        has_diabetes: false,
        has_high_blood_pressure: false,
        has_low_blood_pressure: false,
        birth_date: "1990-01-01T02:00:00.000Z",
        nationality: "Brasileira",
        address: null,
        address_number: null,
        address_complement: null,
        neighborhood: null,
        city: null,
        state: null,
        country: "Brasil",
        emergency_contact_name: null,
        emergency_contact_phone: null,
        user_id: createdUser.id,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      })

      expect(uuidVersion(responseBody.id)).toBe(4)
      expect(Date.parse(responseBody.created_at)).not.toBeNaN()
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN()
    })

    test("With duplicated 'email'", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.setUserFeatures(createdUser.id, ["create:guest"])
      await orchestrator.activateUser(createdUser.id)

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response1 = await fetch("http://localhost:3000/api/v1/guests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          name: "Guest One",
          email: "duplicate@example.com",
          phone: "+5511999999991",
          gender: "Female",
          rg_number: "111111111",
          cpf_number: "111.111.111-11",
          birth_date: "1991-01-01",
        }),
      })

      expect(response1.status).toBe(201)

      const response2 = await fetch("http://localhost:3000/api/v1/guests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          name: "Guest Two",
          email: "duplicate@example.com",
          phone: "+5511999999992",
          gender: "Male",
          rg_number: "222222222",
          cpf_number: "222.222.222-22",
          birth_date: "1992-01-01",
        }),
      })

      expect(response2.status).toBe(409)

      const responseBody = await response2.json()

      expect(responseBody).toEqual({
        name: "ConflictError",
        message: "Já existe um hóspede cadastrado com este e-mail.",
        action: "Utilize um e-mail diferente.",
        status_code: 409,
      })
    })

    test("With duplicated 'rg_number'", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.setUserFeatures(createdUser.id, ["create:guest"])
      await orchestrator.activateUser(createdUser.id)

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response1 = await fetch("http://localhost:3000/api/v1/guests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          name: "Guest Three",
          email: "unique3@example.com",
          phone: "+5511999999993",
          gender: "Female",
          rg_number: "333333333",
          cpf_number: "333.333.333-33",
          birth_date: "1993-01-01",
        }),
      })

      expect(response1.status).toBe(201)

      const response2 = await fetch("http://localhost:3000/api/v1/guests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          name: "Guest Four",
          email: "unique4@example.com",
          phone: "+5511999999994",
          gender: "Male",
          rg_number: "333333333",
          cpf_number: "444.444.444-44",
          birth_date: "1994-01-01",
        }),
      })

      expect(response2.status).toBe(409)

      const responseBody = await response2.json()

      expect(responseBody).toEqual({
        name: "ConflictError",
        message: "Já existe um hóspede cadastrado com este RG.",
        action: "Utilize um RG diferente.",
        status_code: 409,
      })
    })

    test("With duplicated 'cpf_number'", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.setUserFeatures(createdUser.id, ["create:guest"])
      await orchestrator.activateUser(createdUser.id)

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response1 = await fetch("http://localhost:3000/api/v1/guests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          name: "Guest Five",
          email: "unique5@example.com",
          phone: "+5511999999995",
          gender: "Female",
          rg_number: "555555555",
          cpf_number: "555.555.555-55",
          birth_date: "1995-01-01",
        }),
      })

      expect(response1.status).toBe(201)

      const response2 = await fetch("http://localhost:3000/api/v1/guests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          name: "Guest Six",
          email: "unique6@example.com",
          phone: "+5511999999996",
          gender: "Male",
          rg_number: "666666666",
          cpf_number: "555.555.555-55",
          birth_date: "1996-01-01",
        }),
      })

      expect(response2.status).toBe(409)

      const responseBody = await response2.json()

      expect(responseBody).toEqual({
        name: "ConflictError",
        message: "Já existe um hóspede cadastrado com este CPF.",
        action: "Utilize um CPF diferente.",
        status_code: 409,
      })
    })

    test("With missing required fields", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.setUserFeatures(createdUser.id, ["create:guest"])
      await orchestrator.activateUser(createdUser.id)

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch("http://localhost:3000/api/v1/guests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          name: "Felipe",
          email: "",
          phone: "",
          gender: "",
          rg_number: "",
          cpf_number: "",
          birth_date: "",
        }),
      })

      expect(response.status).toBe(400)

      const responseBody = await response.json()

      expect(responseBody).toEqual({
        name: "ValidationError",
        message:
          "Campos obrigatórios ausentes: email, phone, gender, rg_number, cpf_number, birth_date.",
        action: "Envie todos os campos obrigatórios e tente novamente.",
        status_code: 400,
      })
    })
  })
})
