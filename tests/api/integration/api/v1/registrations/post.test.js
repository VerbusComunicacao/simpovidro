import orchestrator from "tests/orchestrator.js"
import database from "infra/database.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("POST /api/v1/registrations", () => {
  jest.useFakeTimers()

  afterAll(() => {
    jest.useRealTimers()
  })

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
                badge_name: "Crachá Teste",
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
    let regularUserId

    beforeAll(async () => {
      // 1. Create and Setup Admin User
      const adminUser = await orchestrator.createUser({
        full_name: "Admin User",
        email: "admin-registration@example.com",
        password: "password123",
      })
      await orchestrator.activateAdmUser(adminUser.id)
      const adminSession = await orchestrator.createSession(adminUser.id)
      admToken = adminSession.token

      // 2. Create Regular User
      const regularUser = await orchestrator.createUser({
        full_name: "Regular User",
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
      regularUserId = regularUser.id

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
            max_adults: 2,
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
                name: "Regular User",
                badge_name: "Crachá Regular",
                email: "user-registration@example.com",
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
                name: "Regular User",
                badge_name: "Crachá Regular",
                email: "user-registration@example.com",
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
                name: "Regular User",
                badge_name: "Crachá Regular",
                email: "user-registration@example.com",
                phone: "11999999999",
                gender: "Masculino",
                rg_number: "111",
                cpf_number: "111.111.111-11",
                birth_date: "1990-01-01",
              },
              {
                name: "Regression Guest",
                badge_name: "Crachá Regression",
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

      // Query database to check if user_id is null for the SECOND guest
      const guestResult = await database.query({
        text: "SELECT user_id, email FROM guests WHERE email = $1",
        values: [guestEmail],
      })

      expect(guestResult.rows[0].user_id).toBe(null)
      expect(guestResult.rows[0].email).toBe(guestEmail)
    })

    test("should enforce backend-calculated installments_count even if client sends different value", async () => {
      // Logic from models/sale.js and models/sale-installment.js to calculate expected values
      // We cannot use jest.useFakeTimers() here because the API runs in a separate process (next dev)
      // and won't respect the mocked time. So we must assert against the logic dynamically based on real time.

      const { Temporal } = require("@js-temporal/polyfill")
      const sale = require("models/sale.js").default
      const saleInstallment = require("models/sale-installment.js").default

      const checkInDate = Temporal.PlainDate.from("2026-11-01")
      const expectedInstallmentsCount =
        sale.calculateMaxInstallments(checkInDate)
      const expectedDates = saleInstallment.generateInstallmentDates(
        expectedInstallmentsCount,
        checkInDate,
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
                name: "Regular User",
                badge_name: "Crachá Regular",
                email: "user-registration@example.com",
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
      expect(saleData.installments_count).toBe(expectedInstallmentsCount)

      const installments = saleData.installments
      expect(installments).toHaveLength(expectedInstallmentsCount)

      installments.forEach((installment, index) => {
        expect(installment.due_date).toBe(expectedDates[index])
      })
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
                name: "Regular User",
                badge_name: "Crachá Regular",
                email: "user-registration@example.com",
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

    test("should apply member price when company has 'Associada' discount", async () => {
      // 1. Create a special room with different member price
      await fetch(`${orchestrator.webserverUrl}/api/v1/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${admToken}`,
        },
        body: JSON.stringify({
          hotel_id: hotelId,
          room_type_id: 1, // Will be resolved by type name in a real flow, but here we use IDs from before
          room_category_id: 1,
          price_per_night: 1000.0,
          member_price_per_night: 850.0,
          total_rooms: 5,
        }),
      })

      // Since the IDs 1 above might be wrong if they are UUIDs, I'll fetch the real IDs from the previous setup
      // Wait, I have access to roomId from before, let's just update IT to have a member price
      await database.query({
        text: `UPDATE rooms SET member_price_per_night = 850.0 WHERE id = $1`,
        values: [roomId],
      })

      // 2. Ensure a company with 'Associada' discount exists
      const cnpj = "11122233000100"
      const assocDiscountResult = await database.query(
        "SELECT id FROM discounts WHERE name = 'Associada' LIMIT 1",
      )
      const assocDiscountId = assocDiscountResult.rows[0].id

      await fetch(`${orchestrator.webserverUrl}/api/v1/companies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${admToken}`,
        },
        body: JSON.stringify({
          corporate_name: "Member Corp",
          cnpj: cnpj,
          badge: "Member",
          phone: "11999999999",
          email: "member@example.com",
          address: "Rua Associada",
          address_number: "1",
          neighborhood: "Centro",
          city: "São Paulo",
          state: "SP",
          zip_code: "01001-000",
          discount_id: assocDiscountId,
        }),
      })

      // 3. Perform registration
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
                name: "Regular User",
                badge_name: "Crachá Regular",
                email: "user-registration@example.com",
                phone: "11999999999",
                gender: "Masculino",
                rg_number: "112233445",
                cpf_number: "111.222.333-44",
                birth_date: "1985-11-10",
              },
            ],
          }),
        },
      )

      expect(response.status).toBe(201)
      const data = JSON.parse(await response.text())

      // 4. Verify Sale Pricing
      const saleResp = await fetch(
        `${orchestrator.webserverUrl}/api/v1/sales/${data.saleId}`,
        {
          headers: { Cookie: `session_id=${userToken}` },
        },
      )
      const saleData = JSON.parse(await saleResp.text())

      // Member price (850) should be used instead of standard price (1000)
      // And discount_percentage should be 0 because it's a fixed member price
      expect(Number(saleData.total_amount)).toBe(850.0)
      expect(Number(saleData.discount_percentage)).toBe(0)
      expect(Number(saleData.discount_amount)).toBe(0)
      expect(Number(saleData.final_amount)).toBe(850.0)
    })

    test("should force the first guest to be the logged-in user even if different data is provided", async () => {
      // 1. Setup: Create a real guest profile for the regular user
      const userRealName = "Real User Name"
      const userRealEmail = "user-registration@example.com"
      const userRealCpf = "111.111.111-11"

      await orchestrator.createGuest({
        name: userRealName,
        email: userRealEmail,
        phone: "11999999999",
        gender: "Masculino",
        rg_number: "RG123",
        cpf_number: userRealCpf,
        birth_date: "1990-01-01",
        user_id: regularUserId,
      })

      // 2. Attempt to register with spoofed first guest data
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
                name: "Imposter Guest", // Different name
                badge_name: "Crachá Impostor",
                email: "imposter@example.com", // Different email
                phone: "11900000000",
                gender: "Feminino",
                rg_number: "RG999",
                cpf_number: "999.999.999-99",
                birth_date: "1980-01-01",
              },
            ],
          }),
        },
      )

      expect(response.status).toBe(404)
    })

    test("should reject registration with spoofed data EVEN IF the user has no previous guest profile", async () => {
      // 1. Setup: Create a new user with NO guest profile
      const newUser = await orchestrator.createUser({
        full_name: "Brand New User",
        email: "brand-new@example.com",
      })
      await orchestrator.activateUser(newUser.id)
      const newSession = await orchestrator.createSession(newUser.id)

      // 2. Attempt to register with "111" spoofed data
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/registrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${newSession.token}`,
          },
          body: JSON.stringify({
            room_id: roomId,
            guests_data: [
              {
                name: "111", // Spoofed name
                badge_name: "Crachá 111",
                email: "111@example.com", // Spoofed email
                phone: "11911111111",
                gender: "Masculino",
                rg_number: "111",
                cpf_number: "111.111.111-11",
                birth_date: "1980-11-11",
              },
            ],
          }),
        },
      )

      // This is expected to BE 404 if the loophole is closed.
      // If the loophole exists, it will return 201.
      expect(response.status).toBe(404)
    })

    test("should generate incremental numeric sale_number starting at 100", async () => {
      // 1. Create first registration
      const response1 = await fetch(
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
                name: "Regular User",
                badge_name: "Crachá Regular",
                email: "user-registration@example.com",
                phone: "11999999999",
                gender: "Masculino",
                rg_number: "RG-SEQ-1",
                cpf_number: "777.777.777-71",
                birth_date: "1990-01-01",
              },
            ],
          }),
        },
      )
      const { saleId: saleId1 } = await response1.json()
      expect(response1.status).toBe(201)

      // 2. Create second registration
      const response2 = await fetch(
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
                name: "Regular User",
                badge_name: "Crachá Regular",
                email: "user-registration@example.com",
                phone: "11999999999",
                gender: "Masculino",
                rg_number: "RG-SEQ-2",
                cpf_number: "777.777.777-72",
                birth_date: "1990-01-01",
              },
            ],
          }),
        },
      )
      const { saleId: saleId2 } = await response2.json()
      expect(response2.status).toBe(201)

      // 3. Query DB and verify
      const sale1 = await database.query({
        text: "SELECT sale_number FROM sales WHERE id = $1",
        values: [saleId1],
      })
      const sale2 = await database.query({
        text: "SELECT sale_number FROM sales WHERE id = $1",
        values: [saleId2],
      })

      const num1 = parseInt(sale1.rows[0].sale_number)
      const num2 = parseInt(sale2.rows[0].sale_number)

      expect(num1).toBeGreaterThanOrEqual(100)
      expect(num2).toBe(num1 + 1)
      expect(sale1.rows[0].sale_number).toMatch(/^\d+$/)
    })

    test("Admin should be able to register ANY guest as the primary registrant (bypass identity check)", async () => {
      // 1. Setup Admin Token (already exists in scope: admToken)
      // 2. Attempt registration with Guest 1 identity !== Admin User
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/registrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${admToken}`,
          },
          body: JSON.stringify({
            room_id: roomId,
            guests_data: [
              {
                name: "Johnny Override",
                badge_name: "Johnny Crachá",
                email: "johnny@example.com",
                phone: "11911111111",
                gender: "Masculino",
                rg_number: "RG-ADMIN-BYPASS",
                cpf_number: "000.000.000-01",
                birth_date: "1985-05-05",
              },
            ],
          }),
        },
      )

      // This should PASS (201) because the user is an admin
      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.saleId).toBeDefined()

      // Verify in DB that guest was created with correct name
      const saleResult = await database.query({
        text: `
          SELECT g.name 
          FROM sales_guests sg 
          JOIN guests g ON sg.guest_id = g.id 
          WHERE sg.sale_id = $1 
          ORDER BY g.created_at ASC 
          LIMIT 1`,
        values: [data.saleId],
      })
      expect(saleResult.rows[0].name).toBe("Johnny Override")
    })
    test("should apply room-specific age policy price when use_percentage is false", async () => {
      // 1. Create Hotel with policies
      const hotelResp = await fetch(
        `${orchestrator.webserverUrl}/api/v1/hotels`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${admToken}`,
          },
          body: JSON.stringify({
            name: "Policy Test Hotel Final",
            city: "Florianópolis",
            country: "Brasil",
            check_in_date: "2026-11-01",
            check_out_date: "2026-11-10",
            price_policies: [
              {
                max_age: 3,
                description: "Criança até 3 anos Grátis",
                use_percentage: true,
                percentage: 0,
              },
              {
                max_age: 12,
                description: "Criança até 12 anos Preço Fixo",
                use_percentage: false,
                percentage: 100,
              },
            ],
          }),
        },
      )
      expect(hotelResp.status).toBe(201)
      const hotelData = await hotelResp.json()
      expect(hotelData.price_policies).toBeDefined()
      expect(hotelData.price_policies).toHaveLength(2)

      // 2. Setup Resources (Type and Category)
      const rtResp = await fetch(
        `${orchestrator.webserverUrl}/api/v1/room-types`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${admToken}`,
          },
          body: JSON.stringify({ name: "PricingRT" }),
        },
      )
      expect(rtResp.status).toBe(201)
      const rtData = await rtResp.json()

      const rcResp = await fetch(
        `${orchestrator.webserverUrl}/api/v1/room-categories`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${admToken}`,
          },
          body: JSON.stringify({
            name: "PricingRC",
            max_adults: 3,
            max_children: 2,
          }),
        },
      )
      expect(rcResp.status).toBe(201)
      const rcData = await rcResp.json()

      // 3. Create Room with override for the 12y policy
      const roomFinalResp = await fetch(
        `${orchestrator.webserverUrl}/api/v1/rooms`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${admToken}`,
          },
          body: JSON.stringify({
            hotel_id: hotelData.id,
            room_type_id: rtData.id,
            room_category_id: rcData.id,
            price_per_night: 200.0,
            total_rooms: 10,
            price_policies: [
              {
                id: hotelData.price_policies[1].id,
                price: 75.5,
              },
            ],
          }),
        },
      )
      expect(roomFinalResp.status).toBe(201)
      const roomData = await roomFinalResp.json()

      // 3. Perform registration
      const guestsData = [
        {
          name: "Adulto",
          badge_name: "Adulto",
          email: "post-registration-adult@test.com",
          phone: "11999999999",
          gender: "Masculino",
          rg_number: "RG-PRICING-1",
          cpf_number: "888.888.888-81",
          birth_date: "1994-01-01",
        },
        {
          name: "Bebê",
          badge_name: "Bebê",
          email: "post-registration-baby@test.com",
          phone: "11999999999",
          gender: "Feminino",
          rg_number: "RG-PRICING-2",
          cpf_number: "888.888.888-82",
          birth_date: "2024-01-01",
        },
        {
          name: "Criança",
          badge_name: "Criança",
          email: "post-registration-child@test.com",
          phone: "11999999999",
          gender: "Masculino",
          rg_number: "RG-PRICING-3",
          cpf_number: "888.888.888-83",
          birth_date: "2016-01-01",
        },
      ]

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/registrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${admToken}`,
          },
          body: JSON.stringify({
            room_id: roomData.id,
            guests_data: guestsData,
            payment_method: "cash",
          }),
        },
      )

      expect(response.status).toBe(201)
      const { saleId } = await response.json()

      // 4. Verify Sale Pricing
      const saleResp = await fetch(
        `${orchestrator.webserverUrl}/api/v1/sales/${saleId}`,
        {
          headers: { Cookie: `session_id=${admToken}` },
        },
      )
      const saleData = await saleResp.json()

      // Expected: 200 (adult) + 0 (baby) + 75.5 (child) = 275.5
      expect(Number(saleData.total_amount)).toBe(275.5)
    })

    test("should use percentage calculation when use_percentage is true, even if room price is defined", async () => {
      // 1. Create Hotel with policy (percentage based)
      const hotelResp = await fetch(
        `${orchestrator.webserverUrl}/api/v1/hotels`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${admToken}`,
          },
          body: JSON.stringify({
            name: "Percentage Priority Hotel",
            city: "Florianópolis",
            country: "Brasil",
            check_in_date: "2026-11-01",
            check_out_date: "2026-11-10",
            price_policies: [
              {
                max_age: 12,
                description: "Criança até 12 anos 50%",
                use_percentage: true,
                percentage: 50,
              },
            ],
          }),
        },
      )
      const hotelData = await hotelResp.json()

      // 2. Setup Resources
      const rtResp = await fetch(
        `${orchestrator.webserverUrl}/api/v1/room-types`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${admToken}`,
          },
          body: JSON.stringify({ name: "PercentageRT" }),
        },
      )
      const rtData = await rtResp.json()

      const rcResp = await fetch(
        `${orchestrator.webserverUrl}/api/v1/room-categories`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${admToken}`,
          },
          body: JSON.stringify({
            name: "PercentageRC",
            max_adults: 2,
            max_children: 1,
          }),
        },
      )
      const rcData = await rcResp.json()

      // 3. Create Room with override price (but use_percentage is TRUE in policy)
      const roomFinalResp = await fetch(
        `${orchestrator.webserverUrl}/api/v1/rooms`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${admToken}`,
          },
          body: JSON.stringify({
            hotel_id: hotelData.id,
            room_type_id: rtData.id,
            room_category_id: rcData.id,
            price_per_night: 200.0,
            total_rooms: 10,
            price_policies: [
              {
                id: hotelData.price_policies[0].id,
                price: 75.0, // This should be ignored because use_percentage is true
              },
            ],
          }),
        },
      )
      const roomData = await roomFinalResp.json()

      // 4. Perform registration for a child (age 10) + ONE ADULT
      const guestsData = [
        {
          name: "Adulto Responsável",
          badge_name: "Adulto",
          email: "adult-percentage@test.com",
          phone: "11999999999",
          gender: "Masculino",
          rg_number: "RG-ADULT-PCT",
          cpf_number: "999.888.777-22",
          birth_date: "1990-01-01",
        },
        {
          name: "Criança",
          badge_name: "Criança",
          email: "percentage-child@test.com",
          phone: "11999999999",
          gender: "Masculino",
          rg_number: "RG-PCT-1",
          cpf_number: "999.888.777-11",
          birth_date: "2016-01-01",
        },
      ]

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/registrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${admToken}`,
          },
          body: JSON.stringify({
            room_id: roomData.id,
            guests_data: guestsData,
            payment_method: "cash",
          }),
        },
      )

      expect(response.status).toBe(201)
      const { saleId } = await response.json()

      // 5. Verify Sale Pricing
      const saleResp = await fetch(
        `${orchestrator.webserverUrl}/api/v1/sales/${saleId}`,
        {
          headers: { Cookie: `session_id=${admToken}` },
        },
      )
      const saleData = await saleResp.json()

      // Expected: Adult (200) + Child (200 * 50% = 100) = 300.0
      expect(Number(saleData.total_amount)).toBe(300.0)
    })

    test("Falha ao tentar adicionar uma criança sozinha no quarto (exige pelo menos um adulto)", async () => {
      // 1. Setup Hotel
      const hotelResp = await fetch(
        `${orchestrator.webserverUrl}/api/v1/hotels`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${admToken}`,
          },
          body: JSON.stringify({
            name: "Adult Required Hotel Unique",
            email: "adult-required-unique@test.com",
            city: "São Paulo",
            country: "Brasil",
            check_in_date: new Date(Date.now() + 86400000).toISOString(),
            check_out_date: new Date(Date.now() + 86400000 * 2).toISOString(),
            price_policies: [
              {
                max_age: 12,
                percentage: 50,
                description: "Criança",
                use_percentage: true,
              },
            ],
          }),
        },
      )
      const hotelData = await hotelResp.json()

      const rtResp = await fetch(
        `${orchestrator.webserverUrl}/api/v1/room-types`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${admToken}`,
          },
          body: JSON.stringify({ name: "SingleAdultRT_Unq" }),
        },
      )
      const rtData = await rtResp.json()

      const rcResp = await fetch(
        `${orchestrator.webserverUrl}/api/v1/room-categories`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${admToken}`,
          },
          body: JSON.stringify({
            name: "SingleAdultRC_Unq",
            max_adults: 1,
            max_children: 1,
          }),
        },
      )
      const rcData = await rcResp.json()

      const roomResp = await fetch(
        `${orchestrator.webserverUrl}/api/v1/rooms`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${admToken}`,
          },
          body: JSON.stringify({
            hotel_id: hotelData.id,
            room_type_id: rtData.id,
            room_category_id: rcData.id,
            price_per_night: 200.0,
            total_rooms: 5,
            blocked_rooms: 0,
            name: "Room Test",
            description: "Room Description",
            photos: [],
          }),
        },
      )
      const roomData = await roomResp.json()

      // Se falhar aqui, o erro será exibido no console para debug
      if (roomResp.status !== 201) {
        console.error("Room creation failed:", roomData)
      }
      expect(roomResp.status).toBe(201)

      // 2. Tenta registrar apenas uma criança (8 anos)
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/registrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${admToken}`,
          },
          body: JSON.stringify({
            room_id: roomData.id,
            guests_data: [
              {
                name: "Criança Sozinha",
                badge_name: "Criança",
                email: "sozinha@test.com",
                phone: "11999999999",
                gender: "Feminino",
                rg_number: "RG-SOZINHA",
                cpf_number: "111.999.333-44", // CPF diferente
                birth_date: "2018-01-01", // ~8 anos
              },
            ],
            payment_method: "cash",
          }),
        },
      )

      // Espera-se que falhe com 400 (Bad Request)
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.message).toContain("pelo menos um adulto")
    })
    describe("Pricing Calculation (Per Person)", () => {
      test("should calculate total as Price * Number of Adults (1 guest)", async () => {
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
                  name: "Regular User",
                  badge_name: "Crachá Regular",
                  email: "user-registration@example.com",
                  phone: "11999999999",
                  gender: "Masculino",
                  rg_number: "PR-1",
                  cpf_number: "222.111.999-01",
                  birth_date: "1990-01-01",
                },
              ],
            }),
          },
        )

        expect(response.status).toBe(201)
        const { saleId } = await response.json()

        const saleResp = await fetch(
          `${orchestrator.webserverUrl}/api/v1/sales/${saleId}`,
          {
            headers: { Cookie: `session_id=${userToken}` },
          },
        )
        const saleData = await saleResp.json()

        // 1 guest * 1000 = 1000
        expect(Number(saleData.total_amount)).toBe(1000.0)
      })

      test("should calculate total as Price * Number of Adults (2 guests)", async () => {
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
                  name: "Regular User",
                  badge_name: "Crachá Reg",
                  email: "user-registration@example.com",
                  phone: "11999999999",
                  gender: "Masculino",
                  rg_number: "PR-3",
                  cpf_number: "222.111.999-03",
                  birth_date: "1990-01-01",
                },
                {
                  name: "Second Guest",
                  badge_name: "Crachá Sec",
                  email: "second@example.com",
                  phone: "11988888888",
                  gender: "Feminino",
                  rg_number: "PR-4",
                  cpf_number: "222.111.999-04",
                  birth_date: "1992-02-02",
                },
              ],
            }),
          },
        )

        expect(response.status).toBe(201)
        const { saleId } = await response.json()

        const saleResp = await fetch(
          `${orchestrator.webserverUrl}/api/v1/sales/${saleId}`,
          {
            headers: { Cookie: `session_id=${userToken}` },
          },
        )
        const saleData = await saleResp.json()

        // 2 guests * 1000 = 2000
        expect(Number(saleData.total_amount)).toBe(2000.0)
      })

      test("should NOT multiply by number of nights (Price per Person/Event)", async () => {
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
                  name: "Regular User",
                  badge_name: "Crachá Reg",
                  email: "user-registration@example.com",
                  phone: "11999999999",
                  gender: "Masculino",
                  rg_number: "PR-5",
                  cpf_number: "222.111.999-05",
                  birth_date: "1990-01-01",
                },
              ],
            }),
          },
        )

        expect(response.status).toBe(201)
        const { saleId } = await response.json()
        const saleResp = await fetch(
          `${orchestrator.webserverUrl}/api/v1/sales/${saleId}`,
          {
            headers: { Cookie: `session_id=${userToken}` },
          },
        )
        const saleData = await saleResp.json()

        // Should still be 1000, not 9000
        expect(Number(saleData.total_amount)).toBe(1000.0)
      })
    })
  })
})
