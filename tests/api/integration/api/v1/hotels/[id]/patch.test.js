import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("PATCH /api/v1/hotels/[id]", () => {
  describe("Anonymous user", () => {
    test("Can't update hotel", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/hotels/780a77f5-6fca-4e95-bc6c-e93e889cba80",
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
        "http://localhost:3000/api/v1/hotels/780a77f5-6fca-4e95-bc6c-e93e889cba80",
        {
          method: "PATCH",
          body: JSON.stringify({
            name: "Updated Hotel",
            city: "Rio de Janeiro",
            country: "Brasil",
            check_in_date: "2026-01-07T20:43:12.021Z",
            check_out_date: "2026-01-10T20:43:12.021Z",
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(403)
    })

    test("Hotel not found", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["update:content"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch(
        "http://localhost:3000/api/v1/hotels/87562c5a-7f7b-4f9e-b4de-08552758e4e9",
        {
          method: "PATCH",
          body: JSON.stringify({
            name: "Updated Hotel",
            city: "Rio de Janeiro",
            country: "Brasil",
            check_in_date: "2026-01-07T20:43:12.021Z",
            check_out_date: "2026-01-10T20:43:12.021Z",
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(404)
    })

    test("Update hotel with blank data", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["update:content"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      // First create a hotel
      const createResponse = await fetch(
        "http://localhost:3000/api/v1/hotels",
        {
          method: "POST",
          body: JSON.stringify({
            name: "Original Hotel",
            city: "São Paulo",
            country: "Brasil",
            email: "original@hotel.com",
            check_in_date: "2026-01-07T20:43:12.021Z",
            check_out_date: "2026-01-10T20:43:12.021Z",
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      const hotelCreated = await createResponse.json()

      // Try to update with blank data
      const response = await fetch(
        `http://localhost:3000/api/v1/hotels/${hotelCreated.id}`,
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

    test("Update hotel successfully", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["update:content"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const hotelCreated = await orchestrator.createHotel(createdUser.id)

      // Update the hotel
      const response = await fetch(
        `http://localhost:3000/api/v1/hotels/${hotelCreated.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: "Updated Hotel Paradise",
            city: "Rio de Janeiro",
            country: "Brasil",
            phone: "+55 2199999999",
            state: "Rio de Janeiro",
            address: "Av. Copacabana, 123",
            email: "updated@hotel.com",
            check_in_date: "2026-01-07T20:43:12.021Z",
            check_out_date: "2026-01-10T20:43:12.021Z",
            associated_company_discount_percentage: "25.00",
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(200)

      const hotelUpdated = await response.json()
      expect(hotelUpdated).toEqual({
        id: hotelCreated.id,
        name: "Updated Hotel Paradise",
        city: "Rio de Janeiro",
        country: "Brasil",
        phone: "+55 2199999999",
        state: "Rio de Janeiro",
        address: "Av. Copacabana, 123",
        associated_company_discount_percentage: "25.00",
        email: "updated@hotel.com",
        check_in_date: "2026-01-07T20:43:12.021Z",
        check_out_date: "2026-01-10T20:43:12.021Z",
        active: false,
        price_policies: [],
        user_id: createdUser.id,
        created_at: hotelCreated.created_at.toISOString(),
        updated_at: expect.any(String),
      })
    })

    test("Update hotel with duplicate name", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["update:content"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      // Create first hotel
      await orchestrator.createHotel(createdUser.id, {
        name: "Hotel A",
        city: "Rio de Janeiro",
        country: "Brasil",
      })

      const hotelB = await orchestrator.createHotel(createdUser.id)

      // Try to update Hotel B to have the same name as Hotel A
      const response = await fetch(
        `http://localhost:3000/api/v1/hotels/${hotelB.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: "Hotel A",
            city: "Rio de Janeiro",
            country: "Brasil",
            check_in_date: "2026-01-07T20:43:12.021Z",
            check_out_date: "2026-01-10T20:43:12.021Z",
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(409)

      const errorBody = await response.json()
      expect(errorBody).toEqual({
        name: "ConflictError",
        status_code: 409,
        message:
          "Já existe um hotel cadastrado com esse nome para este usuário.",
        action: "Escolha outro nome ou edite o hotel existente.",
      })
    })

    test("Update hotel with same name (should work)", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["update:content"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      // Create hotel
      const hotelCreated = await orchestrator.createHotel(createdUser.id, {
        name: "Hotel Original",
        city: "São Paulo",
        country: "Brasil",
      })

      // Update hotel with same name but different city
      const response = await fetch(
        `http://localhost:3000/api/v1/hotels/${hotelCreated.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: "Hotel Original",
            city: "Rio de Janeiro",
            country: "Brasil",
            check_in_date: "2026-01-07T20:43:12.021Z",
            check_out_date: "2026-01-10T20:43:12.021Z",
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(200)

      const hotelUpdated = await response.json()
      expect(hotelUpdated.name).toBe("Hotel Original")
      expect(hotelUpdated.city).toBe("Rio de Janeiro")
    })
  })
})
