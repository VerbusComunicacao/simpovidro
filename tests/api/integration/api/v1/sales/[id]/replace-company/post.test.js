import orchestrator from "tests/orchestrator.js"
import company from "models/company.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("POST /api/v1/sales/[id]/replace-company", () => {
  let adminToken
  let regularToken
  let roomId
  let saleId
  let company1
  let company2

  beforeAll(async () => {
    // 1. Create Admin User
    const adminUser = await orchestrator.createUser({
      full_name: "Admin User",
      email: "admin-replace-company@example.com",
      password: "password123",
    })
    await orchestrator.activateAdmUser(adminUser.id)
    const adminSession = await orchestrator.createSession(adminUser.id)
    adminToken = adminSession.token

    // 2. Create Regular User (without update:content)
    const regularUser = await orchestrator.createUser({
      full_name: "Regular User",
      email: "regular-replace-company@example.com",
      password: "password123",
    })
    await orchestrator.activateUser(regularUser.id)
    const regularSession = await orchestrator.createSession(regularUser.id)
    regularToken = regularSession.token

    // 3. Create Hotel & Room
    const hotel = await orchestrator.createHotel(adminUser.id)
    const roomType = await orchestrator.createRoomType(adminUser.id)
    const roomCategory = await orchestrator.createRoomCategory(adminUser.id, {
      max_adults: 2,
      max_children: 0,
    })

    const room = await orchestrator.createRoom(adminUser.id, {
      hotel_id: hotel.id,
      room_type_id: roomType.id,
      room_category_id: roomCategory.id,
      available_rooms: 10,
      name: "Standard Room",
    })
    roomId = room.id

    // 4. Create Company 1 and Company 2
    company1 = await company.create({
      corporate_name: "Empresa Original LTDA",
      badge: "ORIGINAL",
      cnpj: "11.111.111/0001-11",
      address: "Rua Alfa",
      address_number: "100",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      phone: "11999999991",
      email: "original@empresa.com",
      responsible_person: "Carlos Original",
      zip_code: "01001-000",
    })

    company2 = await company.create({
      corporate_name: "Empresa Nova SA",
      badge: "NOVA",
      cnpj: "22.222.222/0001-22",
      address: "Av Beta",
      address_number: "200",
      neighborhood: "Jardins",
      city: "São Paulo",
      state: "SP",
      phone: "11999999992",
      email: "nova@empresa.com",
      responsible_person: "Ana Nova",
      zip_code: "01401-000",
    })

    // 5. Create Sale linked to Company 1
    const regResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/registrations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          room_id: roomId,
          bed_preference: "Duplo Casal",
          company_cnpj: company1.cnpj,
          guests_data: [
            {
              name: "Hospede Teste 1",
              badge_name: "HOSPEDE1",
              email: "hospede1@example.com",
              phone: "11977777771",
              rg_number: "112233445",
              cpf_number: "11122233344",
              birth_date: "1985-05-15",
              gender: "M",
              nationality: "Brasileira",
            },
            {
              name: "Hospede Teste 2",
              badge_name: "HOSPEDE2",
              email: "hospede2@example.com",
              phone: "11977777772",
              rg_number: "554433221",
              cpf_number: "55544433322",
              birth_date: "1988-08-20",
              gender: "F",
              nationality: "Brasileira",
            },
          ],
        }),
      },
    )

    const regData = await regResponse.json()
    saleId = regData.saleId
  })

  test("Anonymous user should receive 401 Unauthorized", async () => {
    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}/replace-company`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_company_id: company2.id }),
      },
    )

    expect(response.status).toBe(401)
  })

  test("Regular user without update:content should receive 403 Forbidden", async () => {
    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}/replace-company`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${regularToken}`,
        },
        body: JSON.stringify({ new_company_id: company2.id }),
      },
    )

    expect(response.status).toBe(403)
  })

  test("Missing new_company_id should return 400 Bad Request", async () => {
    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}/replace-company`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({}),
      },
    )

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.message).toContain("O ID da nova empresa é obrigatório.")
  })

  test("Non-existent sale ID should return 404 Not Found", async () => {
    const fakeSaleId = "00000000-0000-4000-8000-000000000000"
    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${fakeSaleId}/replace-company`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({ new_company_id: company2.id }),
      },
    )

    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.message).toContain("Inscrição não encontrada.")
  })

  test("Non-existent new_company_id should return 404 Not Found", async () => {
    const fakeCompanyId = "00000000-0000-4000-8000-000000000001"
    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}/replace-company`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({ new_company_id: fakeCompanyId }),
      },
    )

    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.message).toContain(
      "A nova empresa informada não foi encontrada.",
    )
  })

  test("Selecting the same company as the current one should return 400", async () => {
    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}/replace-company`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({ new_company_id: company1.id }),
      },
    )

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.message).toContain(
      "A nova empresa selecionada é a mesma atualmente vinculada à inscrição.",
    )
  })

  test("Admin successfully replaces company with send_email = false", async () => {
    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}/replace-company`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          new_company_id: company2.id,
          send_email: false,
        }),
      },
    )

    expect(response.status).toBe(200)
    const updatedSale = await response.json()
    expect(updatedSale.company_id).toBe(company2.id)
    expect(updatedSale.company_corporate_name).toBe("Empresa Nova SA")

    // Verify all guests have updated company_cnpj
    updatedSale.guests.forEach((g) => {
      expect(g.company_cnpj).toBe(company2.cnpj.replace(/\D/g, ""))
    })
  })

  test("Admin successfully replaces company back to company1 with send_email = true", async () => {
    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}/replace-company`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          new_company_id: company1.id,
          send_email: true,
        }),
      },
    )

    expect(response.status).toBe(200)
    const updatedSale = await response.json()
    expect(updatedSale.company_id).toBe(company1.id)
    expect(updatedSale.company_corporate_name).toBe("Empresa Original LTDA")

    updatedSale.guests.forEach((g) => {
      expect(g.company_cnpj).toBe(company1.cnpj.replace(/\D/g, ""))
    })
  })
})
