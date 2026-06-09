import orchestrator from "tests/orchestrator.js"
import database from "infra/database.js"
import report from "models/report.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("POST /api/v1/registrations (International)", () => {
  let adminToken
  let userToken
  let hotelId
  let roomId
  let regularUserId
  let roomTypeId
  let roomCategoryId

  beforeAll(async () => {
    // 1. Create and Setup Admin User
    const adminUser = await orchestrator.createUser({
      full_name: "Admin User",
      email: "admin-registration-intl@example.com",
      password: "password123",
    })
    await orchestrator.activateAdmUser(adminUser.id)
    const adminSession = await orchestrator.createSession(adminUser.id)
    adminToken = adminSession.token

    // 2. Create Regular User
    const regularUser = await orchestrator.createUser({
      full_name: "Regular User",
      email: "user-registration-intl@example.com",
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
    const hotelResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/hotels`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          name: "International Hotel",
          city: "New York",
          country: "United States",
          check_in_date: "2026-11-01",
          check_out_date: "2026-11-10",
        }),
      },
    )
    const hotelText = await hotelResponse.text()
    if (hotelResponse.status !== 201)
      throw new Error(`Hotel setup failed: ${hotelText}`)
    hotelId = JSON.parse(hotelText).id

    // 4. Create a room type (as admin)
    const roomTypeResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/room-types`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({ name: "Single" }),
      },
    )
    const roomTypeText = await roomTypeResponse.text()
    if (roomTypeResponse.status !== 201)
      throw new Error(`Room type setup failed: ${roomTypeText}`)
    const roomTypeData = JSON.parse(roomTypeText)
    roomTypeId = roomTypeData.id

    // 5. Create a room category (as admin)
    const roomCategoryResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/room-categories`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          name: "Standard",
          max_adults: 2,
          max_children: 0,
        }),
      },
    )
    const roomCategoryText = await roomCategoryResponse.text()
    if (roomCategoryResponse.status !== 201)
      throw new Error(`Room category setup failed: ${roomCategoryText}`)
    const roomCategoryData = JSON.parse(roomCategoryText)
    roomCategoryId = roomCategoryData.id

    // 6. Create a room (as admin)
    const roomResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/rooms`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          hotel_id: hotelId,
          room_type_id: roomTypeData.id,
          room_category_id: roomCategoryData.id,
          price_per_night: 1000.0,
          total_rooms: 10,
          name: "Quarto Inscrição Internacional",
        }),
      },
    )
    const roomText = await roomResponse.text()
    if (roomResponse.status !== 201)
      throw new Error(`Room setup failed: ${roomText}`)
    roomId = JSON.parse(roomText).id
  })

  test("should successfully register an international company (no CNPJ) and an international guest (no CPF/RG, with passport)", async () => {
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
          payment_method: "pix",
          company_data: {
            corporate_name: "Global Glass Inc.",
            badge: "Global Glass",
            cnpj: null,
            phone: "12025550143",
            email: "contact@globalglass.com",
            address: "5th Avenue, 100",
            address_number: "100",
            neighborhood: "Manhattan",
            city: "New York",
            state: "NY",
            country: "United States",
            zip_code: "10001",
            permission: "A",
          },
          guests_data: [
            {
              name: "Alice Smith",
              badge_name: "ALICE",
              email: "alice@example.com",
              phone: "12025550189",
              gender: "Feminino",
              passport_number: "US987654321",
              birth_date: "1988-08-18",
              nationality: "Americana",
              country: "United States",
              state: "NY",
              city: "New York",
            },
          ],
        }),
      },
    )

    const registrationText = await response.text()
    expect(response.status).toBe(201)

    const data = JSON.parse(registrationText)
    expect(data.saleId).toBeDefined()
    expect(data.guestIds.length).toBe(1)

    // Check Sale and Company Association in database
    const saleResult = await database.query({
      text: "SELECT * FROM sales WHERE id = $1",
      values: [data.saleId],
    })
    expect(saleResult.rowCount).toBe(1)
    const sale = saleResult.rows[0]
    expect(sale.company_id).toBeDefined()
    expect(sale.company_id).not.toBeNull()

    const companyResult = await database.query({
      text: "SELECT * FROM companies WHERE id = $1",
      values: [sale.company_id],
    })
    expect(companyResult.rowCount).toBe(1)
    const company = companyResult.rows[0]
    expect(company.corporate_name).toBe("Global Glass Inc.")
    expect(company.cnpj).toBeNull()
    expect(company.country).toBe("United States")

    // Check Guest details in database
    const guestResult = await database.query({
      text: "SELECT * FROM guests WHERE id = $1",
      values: [data.guestIds[0]],
    })
    expect(guestResult.rowCount).toBe(1)
    const guest = guestResult.rows[0]
    expect(guest.name).toBe("Alice Smith")
    expect(guest.passport_number).toBe("US987654321")
    expect(guest.cpf_number).toBeNull()
    expect(guest.rg_number).toBeNull()
    expect(guest.country).toBe("United States")

    // Check consolidated reports
    const completeReport = await report.generateCompleteReport(hotelId)
    expect(completeReport.length).toBeGreaterThanOrEqual(1)
    const reportItem = completeReport.find(item => item["Nome"] === "Alice Smith")
    expect(reportItem).toBeDefined()
    expect(reportItem["Passaporte"]).toBe("US987654321")
    expect(reportItem["CPF"]).toBeNull()
    expect(reportItem["RG"]).toBeNull()
    expect(reportItem["Empresa"]).toBe("Global Glass Inc.")
    expect(reportItem["CNPJ da empresa"]).toBeNull()

    const companyReport = await report.generateByCompany(hotelId)
    const companyReportItem = companyReport.find(item => item.company_name === "Global Glass Inc.")
    expect(companyReportItem).toBeDefined()
    expect(companyReportItem.cnpj).toBe("N/A")
    expect(Number(companyReportItem.total_participants)).toBe(1)
  })

  test("should fail validation if passport number is missing for a foreign guest", async () => {
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
          payment_method: "pix",
          guests_data: [
            {
              name: "Bob Jones",
              badge_name: "BOB",
              email: "bob@example.com",
              phone: "447911123456",
              gender: "Masculino",
              birth_date: "1992-12-12",
              nationality: "Britânica",
              country: "United Kingdom",
              passport_number: "", // empty/missing
            },
          ],
        }),
      },
    )

    expect(response.status).toBe(400)
    const errorData = await response.json()
    expect(errorData.name).toBe("ValidationError")
    expect(errorData.message).toContain("passport_number")
  })

  test("should fail validation if duplicate passport numbers are sent in the same request", async () => {
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
          payment_method: "pix",
          guests_data: [
            {
              name: "John Doe 1",
              badge_name: "JOHN1",
              email: "john1@example.com",
              phone: "12025550100",
              gender: "Masculino",
              passport_number: "DUPLICATE123",
              birth_date: "1980-01-01",
              nationality: "Americana",
              country: "United States",
            },
            {
              name: "John Doe 2",
              badge_name: "JOHN2",
              email: "john2@example.com",
              phone: "12025550200",
              gender: "Masculino",
              passport_number: "DUPLICATE123", // duplicate passport
              birth_date: "1981-01-01",
              nationality: "Americana",
              country: "United States",
            },
          ],
        }),
      },
    )

    expect(response.status).toBe(400)
    const errorData = await response.json()
    expect(errorData.name).toBe("ValidationError")
    expect(errorData.message).toContain("Passaporte duplicado")
  })

  test("should successfully save checkout_question_response in registration and select hotel_checkout_question_en details", async () => {
    await database.query({
      text: "UPDATE hotels SET checkout_question = $1, checkout_question_en = $2 WHERE id = $3",
      values: ["Pergunta em PT", "Question in EN", hotelId],
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
          payment_method: "remessa_bancaria",
          checkout_question_response: "Yes, I prefer medium size",
          guests_data: [
            {
              name: "Charlie Brown",
              badge_name: "CHARLIE",
              email: "charlie@example.com",
              phone: "12025559999",
              gender: "Masculino",
              passport_number: "US111222333",
              birth_date: "1990-05-05",
              nationality: "Americana",
              country: "United States",
              state: "NY",
              city: "New York",
            },
          ],
        }),
      },
    )

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.saleId).toBeDefined()

    const saleResult = await database.query({
      text: `
        SELECT 
          s.*,
          h.checkout_question_en as hotel_checkout_question_en
        FROM sales s
        JOIN hotels h ON s.hotel_id = h.id
        WHERE s.id = $1
      `,
      values: [data.saleId],
    })
    expect(saleResult.rowCount).toBe(1)
    expect(saleResult.rows[0].checkout_question_response).toBe("Yes, I prefer medium size")
    expect(saleResult.rows[0].hotel_checkout_question_en).toBe("Question in EN")
  })
})
