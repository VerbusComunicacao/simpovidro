import orchestrator from "tests/orchestrator.js"
import database from "infra/database.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("POST /api/v1/registrations", () => {
  describe("Anonymous user", () => {
    test("should return 401", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/registrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            room_id: "782f0590-7608-433e-9080-60b5e438902d",
            guests_data: [
              {
                name: "Test Guest",
                phone: "11999999999",
                gender: "Masculino",
                rg_number: "123456789",
                cpf_number: "123.456.789-01",
                birth_date: "1990-01-01",
              },
            ],
          }),
        },
      )

      expect(response.status).toBe(401)
    })
  })

  describe("Authenticated user", () => {
    let admToken
    let userToken
    let hotelId
    let roomId

    beforeAll(async () => {
      // 1. Create and Setup Admin User
      const adminUser = await orchestrator.createUser({
        email: "admin-registration@example.com",
        password: "password123",
      })
      await orchestrator.activateAdmUser(adminUser.id)
      const adminSession = await orchestrator.createSession(adminUser.id)
      admToken = adminSession.token

      // 2. Create Regular User
      const regularUser = await orchestrator.createUser({
        email: "user-registration@example.com",
        password: "password123",
      })
      await orchestrator.activateUser(regularUser.id)
      await orchestrator.setUserFeatures(regularUser.id, [
        "create:session",
        "read:session",
        "create:guest",
        "read:guest",
        "read:user",
        "update:user",
        "read:content",
      ])
      const regularSession = await orchestrator.createSession(regularUser.id)
      userToken = regularSession.token

      // 3. Create a hotel (as admin)
      const hotelResp = await fetch(
        `${orchestrator.webserverUrl}/api/v1/hotels`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${admToken}`,
          },
          body: JSON.stringify({
            name: "Discount Hotel",
            city: "São Paulo",
            country: "Brasil",
            check_in_date: "2026-11-01",
            check_out_date: "2026-11-10",
          }),
        },
      )
      const hotelText = await hotelResp.text()
      if (hotelResp.status !== 201)
        throw new Error(`Hotel setup failed: ${hotelText}`)
      hotelId = JSON.parse(hotelText).id

      // 4. Create a room type (as admin)
      const rtResp = await fetch(
        `${orchestrator.webserverUrl}/api/v1/room-types`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${admToken}`,
          },
          body: JSON.stringify({ name: "Single" }),
        },
      )
      const rtText = await rtResp.text()
      if (rtResp.status !== 201)
        throw new Error(`Room type setup failed: ${rtText}`)
      const rtData = JSON.parse(rtText)

      // 5. Create a room category (as admin)
      const rcResp = await fetch(
        `${orchestrator.webserverUrl}/api/v1/room-categories`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${admToken}`,
          },
          body: JSON.stringify({
            name: "Standard",
            max_adults: 1,
            max_children: 0,
          }),
        },
      )
      const rcText = await rcResp.text()
      if (rcResp.status !== 201)
        throw new Error(`Room category setup failed: ${rcText}`)
      const rcData = JSON.parse(rcText)

      // 6. Create a room (as admin)
      const roomResp = await fetch(
        `${orchestrator.webserverUrl}/api/v1/rooms`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${admToken}`,
          },
          body: JSON.stringify({
            hotel_id: hotelId,
            room_type_id: rtData.id,
            room_category_id: rcData.id,
            price_per_night: 1000.0,
            total_rooms: 10,
          }),
        },
      )
      const roomText = await roomResp.text()
      if (roomResp.status !== 201)
        throw new Error(`Room setup failed: ${roomText}`)
      roomId = JSON.parse(roomText).id
    })

    test("should apply discount when company is eligible", async () => {
      const cnpj = "12345678000199"

      const compResp = await fetch(
        `${orchestrator.webserverUrl}/api/v1/companies`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${admToken}`,
          },
          body: JSON.stringify({
            corporate_name: "Eligible Corp",
            cnpj: cnpj,
            badge: "Eligible",
            phone: "11999999999",
            email: "eligible@example.com",
            address: "Rua Teste",
            address_number: "123",
            neighborhood: "Centro",
            city: "São Paulo",
            state: "SP",
            responsible_person: "Admin",
            zip_code: "01001-000",
            permission: "A",
            custom_discount_percentage: 25.0,
          }),
        },
      )
      const compText = await compResp.text()
      if (compResp.status !== 201)
        throw new Error(`Company setup failed: ${compText}`)

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/registrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${userToken}`,
          },
          body: JSON.stringify({
            room_id: roomId,
            company_cnpj: cnpj,
            guests_data: [
              {
                name: "Test Guest",
                email: "guest@example.com",
                phone: "11999999999",
                gender: "Masculino",
                rg_number: "123456789",
                cpf_number: "123.456.789-01",
                birth_date: "1990-01-01",
              },
            ],
          }),
        },
      )

      const regText = await response.text()
      if (response.status !== 201)
        throw new Error(`Registration failed (${response.status}): ${regText}`)

      const data = JSON.parse(regText)
      expect(data.saleId).toBeDefined()

      const saleResp = await fetch(
        `${orchestrator.webserverUrl}/api/v1/sales/${data.saleId}`,
        {
          headers: { Cookie: `session_id=${userToken}` },
        },
      )
      const saleText = await saleResp.text()
      if (saleResp.status !== 200)
        throw new Error(`Sale lookup failed: ${saleText}`)
      const saleData = JSON.parse(saleText)

      expect(Number(saleData.discount_percentage)).toBe(25.0)
      expect(Number(saleData.discount_amount)).toBe(250.0)
      expect(Number(saleData.final_amount)).toBe(750.0)
    })

    test("should NOT allow a regular user to create a company with discount_status 'S'", async () => {
      const cnpj = "55555666000177"
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/companies`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${userToken}`,
          },
          body: JSON.stringify({
            corporate_name: "Sneaky Corp",
            cnpj: cnpj,
            badge: "Sneaky",
            phone: "2188888888",
            email: "sneaky@example.com",
            address: "Rua Sneaky",
            address_number: "666",
            neighborhood: "Sombra",
            city: "Rio",
            state: "RJ",
            responsible_person: "Cheater",
            zip_code: "20000-000",
            permission: "A",
            custom_discount_percentage: 50.0,
          }),
        },
      )

      const compText = await response.text()
      if (response.status !== 201)
        throw new Error(`Sneaky company creation failed: ${compText}`)

      const companyData = JSON.parse(compText)
      expect(companyData.custom_discount_percentage).toBe(null)
    })

    test("should NOT apply discount when company is NOT eligible", async () => {
      const cnpj = "98765432000188"

      await fetch(`${orchestrator.webserverUrl}/api/v1/companies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${userToken}`,
        },
        body: JSON.stringify({
          corporate_name: "Non-Eligible Corp",
          cnpj: cnpj,
          badge: "Non-Eligible",
          phone: "3177777777",
          email: "poor@example.com",
          address: "Rua Pobre",
          address_number: "0",
          neighborhood: "Subúrbio",
          city: "BH",
          state: "MG",
          responsible_person: "Nobody",
          zip_code: "30000-000",
          permission: "A",
          custom_discount_percentage: null,
        }),
      })

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/registrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${userToken}`,
          },
          body: JSON.stringify({
            room_id: roomId,
            company_cnpj: cnpj,
            guests_data: [
              {
                name: "Another Guest",
                email: "another@example.com",
                phone: "11988888888",
                gender: "Feminino",
                rg_number: "987654321",
                cpf_number: "987.654.321-02",
                birth_date: "1995-05-05",
              },
            ],
          }),
        },
      )

      const regText = await response.text()
      if (response.status !== 201)
        throw new Error(`Registration failed: ${regText}`)
      const data = JSON.parse(regText)

      const saleResp = await fetch(
        `${orchestrator.webserverUrl}/api/v1/sales/${data.saleId}`,
        {
          headers: { Cookie: `session_id=${userToken}` },
        },
      )
      const saleText = await saleResp.text()
      if (saleResp.status !== 200)
        throw new Error(`Sale lookup failed: ${saleText}`)
      const saleData = JSON.parse(saleText)

      expect(Number(saleData.discount_percentage)).toBe(0)
      expect(Number(saleData.discount_amount)).toBe(0)
      expect(Number(saleData.final_amount)).toBe(1000.0)
    })

    test("should NOT associate guest with logged-in user when a different email is provided (Regression)", async () => {
      const guestEmail = "regression-other-guest@example.com"

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/registrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${userToken}`,
          },
          body: JSON.stringify({
            room_id: roomId,
            guests_data: [
              {
                name: "Regression Guest",
                email: guestEmail,
                phone: "11977777777",
                gender: "Masculino",
                rg_number: "777888999",
                cpf_number: "777.888.999-77",
                birth_date: "1990-07-07",
              },
            ],
          }),
        },
      )

      expect(response.status).toBe(201)

      // Query database to check if user_id is null
      const guestResult = await database.query({
        text: "SELECT user_id, email FROM guests WHERE email = $1",
        values: [guestEmail],
      })

      expect(guestResult.rows[0].user_id).toBe(null)
      expect(guestResult.rows[0].email).toBe(guestEmail)
    })

    test("should enforce backend-calculated installments_count even if client sends different value", async () => {
      // Hotel setup in beforeAll has check_in_date: "2026-11-01"
      // Assuming today is Feb 2026 (for the sake of the test environment stability/knowledge)
      // The calculation is: (2026-2026)*12 - now.getMonth() + 10 + 1
      const now = new Date()
      const expectedInstallments = Math.max(
        1,
        (2026 - now.getFullYear()) * 12 - now.getMonth() + 10 + 1,
      )

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/registrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${userToken}`,
          },
          body: JSON.stringify({
            room_id: roomId,
            payment_method: "installments",
            installments_count: 5, // Client tries to set 5, but backend should enforce the calculated value
            guests_data: [
              {
                name: "Installment Guest",
                email: "installment@example.com",
                phone: "11966666666",
                gender: "Masculino",
                rg_number: "666555444",
                cpf_number: "666.555.444-66",
                birth_date: "1985-12-12",
              },
            ],
          }),
        },
      )

      expect(response.status).toBe(201)
      const data = JSON.parse(await response.text())

      const saleResp = await fetch(
        `${orchestrator.webserverUrl}/api/v1/sales/${data.saleId}`,
        {
          headers: { Cookie: `session_id=${userToken}` },
        },
      )
      const saleData = JSON.parse(await saleResp.text())

      expect(saleData.payment_method).toBe("installments")
      expect(saleData.installments_count).toBe(expectedInstallments)
    })

    test("should rollback all changes if an error occurs during sale creation (Transaction Atomicity)", async () => {
      // 1. Manually set room as unavailable to trigger a validation error in sale.create
      // but AFTER guest.upsert has been called in registration.create.
      await database.query({
        text: `UPDATE rooms SET available_rooms = 0 WHERE id = $1`,
        values: [roomId],
      })

      const orphanCpf = "999.888.777-66"
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/registrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${userToken}`,
          },
          body: JSON.stringify({
            room_id: roomId,
            guests_data: [
              {
                name: "Orphan Guest",
                email: "orphan@example.com",
                phone: "11999999999",
                gender: "Feminino",
                rg_number: "998877665",
                cpf_number: orphanCpf,
                birth_date: "1990-05-05",
              },
            ],
          }),
        },
      )

      // 2. Expect failure
      expect(response.status).toBe(400)
      const errorData = JSON.parse(await response.text())
      expect(errorData.message).toBe("Este quarto não está mais disponível.")

      // 3. Verify that the guest was NOT created (it should have been rolled back)
      const guestResults = await database.query({
        text: `SELECT id FROM guests WHERE cpf_number = $1`,
        values: [orphanCpf],
      })

      expect(guestResults.rowCount).toBe(0)

      // Cleanup: restore room availability
      await database.query({
        text: `UPDATE rooms SET available_rooms = 10 WHERE id = $1`,
        values: [roomId],
      })
    })
  })
})
