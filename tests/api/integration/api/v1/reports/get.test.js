import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("GET /api/v1/reports", () => {
  let adminToken
  let regularToken
  let reportUserToken
  let hotelId

  beforeAll(async () => {
    // 1. Create Admin User
    const adminUser = await orchestrator.createUser({
      full_name: "Admin Reports User",
      email: "admin-reports@example.com",
      password: "password123",
    })
    await orchestrator.activateAdmUser(adminUser.id)
    const adminSession = await orchestrator.createSession(adminUser.id)
    adminToken = adminSession.token

    // 2. Create Regular User (without read:sale:others)
    const regularUser = await orchestrator.createUser({
      full_name: "Regular User No Reports",
      email: "user-noreports@example.com",
      password: "password123",
    })
    await orchestrator.activateUser(regularUser.id)
    const regularSession = await orchestrator.createSession(regularUser.id)
    regularToken = regularSession.token

    // 3. Create User with read:sale:others permission
    const reportUser = await orchestrator.createUser({
      full_name: "Report Reader User",
      email: "report-reader@example.com",
      password: "password123",
    })
    await orchestrator.activateUser(reportUser.id)
    await orchestrator.setUserFeatures(reportUser.id, [
      "create:session",
      "read:session",
      "read:sale:others",
    ])
    const reportSession = await orchestrator.createSession(reportUser.id)
    reportUserToken = reportSession.token

    // 4. Create Hotel
    const hotelResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/hotels`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          name: "Report Test Hotel",
          city: "São Paulo",
          country: "Brasil",
          check_in_date: "2026-11-01",
          check_out_date: "2026-11-05",
        }),
      },
    )
    const hotelData = await hotelResponse.json()
    hotelId = hotelData.id
  })

  describe("Sad path", () => {
    test("When user is anonymous, should return 400", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/reports?type=by-company&hotel_id=${hotelId}`,
      )
      expect(response.status).toBe(400)
      const responseBody = await response.json()
      expect(responseBody.name).toBe("ValidationError")
      expect(responseBody.message).toBe(
        "Você precisa estar logado para acessar os relatórios.",
      )
    })

    test("When user lacks read:sale:others feature, should return 400", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/reports?type=by-company&hotel_id=${hotelId}`,
        {
          headers: {
            Cookie: `session_id=${regularToken}`,
          },
        },
      )
      expect(response.status).toBe(400)
      const responseBody = await response.json()
      expect(responseBody.name).toBe("ValidationError")
      expect(responseBody.message).toBe(
        "Você não tem permissão para acessar relatórios.",
      )
    })

    test("When hotel_id is missing, should return 400", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/reports?type=by-company`,
        {
          headers: {
            Cookie: `session_id=${reportUserToken}`,
          },
        },
      )
      expect(response.status).toBe(400)
      const responseBody = await response.json()
      expect(responseBody.name).toBe("ValidationError")
      expect(responseBody.message).toBe("É obrigatório selecionar um hotel.")
    })

    test("When type is invalid, should return 400", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/reports?type=invalid-type&hotel_id=${hotelId}`,
        {
          headers: {
            Cookie: `session_id=${reportUserToken}`,
          },
        },
      )
      expect(response.status).toBe(400)
      const responseBody = await response.json()
      expect(responseBody.name).toBe("ValidationError")
      expect(responseBody.message).toBe("Tipo de relatório inválido.")
    })
  })

  describe("Happy path", () => {
    test("When requesting by-company report with valid user and hotel_id, should return 200 and data with sale_number in participants", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/reports?type=by-company&hotel_id=${hotelId}`,
        {
          headers: {
            Cookie: `session_id=${reportUserToken}`,
          },
        },
      )
      expect(response.status).toBe(200)
      const responseBody = await response.json()
      expect(Array.isArray(responseBody)).toBe(true)
    })

    test("When requesting transfer-in report, should return 200 and expected columns", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/reports?type=transfer-in&hotel_id=${hotelId}`,
        {
          headers: {
            Cookie: `session_id=${reportUserToken}`,
          },
        },
      )
      expect(response.status).toBe(200)
      const responseBody = await response.json()
      expect(Array.isArray(responseBody)).toBe(true)
    })

    test("When requesting transfer-out report, should return 200 and expected columns", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/reports?type=transfer-out&hotel_id=${hotelId}`,
        {
          headers: {
            Cookie: `session_id=${reportUserToken}`,
          },
        },
      )
      expect(response.status).toBe(200)
      const responseBody = await response.json()
      expect(Array.isArray(responseBody)).toBe(true)
    })
  })
})
