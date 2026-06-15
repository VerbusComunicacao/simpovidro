import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("PATCH /api/v1/sales/[id]", () => {
  let adminToken
  let userToken
  let roomId
  let saleId

  beforeAll(async () => {
    // 1. Setup Admin User
    const adminUser = await orchestrator.createUser({
      full_name: "Admin User",
      email: "admin-sales-patch@example.com",
      password: "password123",
    })
    await orchestrator.activateAdmUser(adminUser.id)
    const adminSession = await orchestrator.createSession(adminUser.id)
    adminToken = adminSession.token

    // 2. Setup Regular User
    const regularUser = await orchestrator.createUser({
      full_name: "Regular User",
      email: "user-sales-patch@example.com",
      password: "password123",
    })
    await orchestrator.activateUser(regularUser.id)
    const regularSession = await orchestrator.createSession(regularUser.id)
    userToken = regularSession.token

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
      name: "Room Double",
    })
    roomId = room.id

    // 4. Create base registration (sale)
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
          guests_data: [
            {
              name: "Maria Teste",
              badge_name: "MARIA",
              email: "maria@example.com",
              phone: "11988888881",
              gender: "Feminino",
              rg_number: "223334441",
              cpf_number: "222.333.444-11",
              birth_date: "1995-05-15",
            },
            {
              name: "João Teste",
              badge_name: "JOAO",
              email: "joao@example.com",
              phone: "11977777771",
              gender: "Masculino",
              rg_number: "334445551",
              cpf_number: "333.444.555-11",
              birth_date: "1994-04-14",
            },
          ],
        }),
      },
    )
    if (regResponse.status !== 201) {
      throw new Error(
        `Failed to create base registration: ${regResponse.status}`,
      )
    }
    const regData = await regResponse.json()
    saleId = regData.saleId
  })

  test("should update bed_preference from Duplo Casal to Duplo Solteiro successfully without email", async () => {
    // Verify initial bed preference
    let saleDetailsResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}`,
      {
        headers: { Cookie: `session_id=${adminToken}` },
      },
    )
    let saleDetails = await saleDetailsResponse.json()
    expect(saleDetails.bed_preference).toBe("Duplo Casal")

    // Patch preference to Duplo Solteiro
    const patchResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          bed_preference: "Duplo Solteiro",
          send_email: false,
        }),
      },
    )
    expect(patchResponse.status).toBe(200)

    // Verify change
    saleDetailsResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}`,
      {
        headers: { Cookie: `session_id=${adminToken}` },
      },
    )
    saleDetails = await saleDetailsResponse.json()
    expect(saleDetails.bed_preference).toBe("Duplo Solteiro")
  })

  test("should update bed_preference from Duplo Solteiro to Duplo Casal and send email", async () => {
    // Patch preference to Duplo Casal and request email
    const patchResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          bed_preference: "Duplo Casal",
          send_email: true,
        }),
      },
    )
    expect(patchResponse.status).toBe(200)

    // Verify change
    const saleDetailsResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}`,
      {
        headers: { Cookie: `session_id=${adminToken}` },
      },
    )
    const saleDetails = await saleDetailsResponse.json()
    expect(saleDetails.bed_preference).toBe("Duplo Casal")
  })

  test("should return 400 when trying to update bed_preference on a cancelled sale", async () => {
    // Create another sale to cancel
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
          guests_data: [
            {
              name: "Maria Teste 3",
              badge_name: "MARIA3",
              email: "maria3@example.com",
              phone: "11988888883",
              gender: "Feminino",
              rg_number: "223334443",
              cpf_number: "222.333.444-33",
              birth_date: "1995-05-15",
            },
            {
              name: "João Teste 3",
              badge_name: "JOAO3",
              email: "joao3@example.com",
              phone: "11977777773",
              gender: "Masculino",
              rg_number: "334445553",
              cpf_number: "333.444.555-33",
              birth_date: "1994-04-14",
            },
          ],
        }),
      },
    )
    expect(regResponse.status).toBe(201)
    const regData = await regResponse.json()
    const testSaleId = regData.saleId

    // Cancel this sale
    const cancelResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${testSaleId}?send_email=false`,
      {
        method: "DELETE",
        headers: { Cookie: `session_id=${adminToken}` },
      },
    )
    expect(cancelResponse.status).toBe(204)

    // Try to update bed preference
    const patchResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${testSaleId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          bed_preference: "Duplo Solteiro",
          send_email: false,
        }),
      },
    )
    expect(patchResponse.status).toBe(400)
    const patchData = await patchResponse.json()
    expect(patchData.message).toBe(
      "Não é possível alterar a acomodação de uma inscrição cancelada.",
    )
  })

  test("should return 400 when trying to update with an invalid bed_preference value", async () => {
    const patchResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          bed_preference: "Triplo",
          send_email: false,
        }),
      },
    )
    expect(patchResponse.status).toBe(400)
  })

  test("should return 403 when trying to update bed_preference as non-admin user", async () => {
    const patchResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${userToken}`,
        },
        body: JSON.stringify({
          bed_preference: "Duplo Solteiro",
          send_email: false,
        }),
      },
    )
    expect(patchResponse.status).toBe(403)
  })

  test("should update checkout_question_response successfully", async () => {
    // Verify initial checkout question response (should be null or empty)
    let saleDetailsResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}`,
      {
        headers: { Cookie: `session_id=${adminToken}` },
      },
    )
    let saleDetails = await saleDetailsResponse.json()
    expect(saleDetails.checkout_question_response).toBeNull()

    // Patch checkout_question_response
    const patchResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          checkout_question_response:
            "Sim, gostaria de checkout tardio às 14h.",
          send_email: false,
        }),
      },
    )
    expect(patchResponse.status).toBe(200)

    // Verify change
    saleDetailsResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}`,
      {
        headers: { Cookie: `session_id=${adminToken}` },
      },
    )
    saleDetails = await saleDetailsResponse.json()
    expect(saleDetails.checkout_question_response).toBe(
      "Sim, gostaria de checkout tardio às 14h.",
    )
  })

  test("should return 400 when trying to update checkout_question_response on a cancelled sale", async () => {
    // Create another sale to cancel
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
          guests_data: [
            {
              name: "Maria Teste Q",
              badge_name: "MARIAQ",
              email: "mariaq@example.com",
              phone: "11988888889",
              gender: "Feminino",
              rg_number: "223334449",
              cpf_number: "222.333.444-99",
              birth_date: "1995-05-15",
            },
            {
              name: "João Teste Q",
              badge_name: "JOAOQ",
              email: "joaoq@example.com",
              phone: "11977777779",
              gender: "Masculino",
              rg_number: "334445559",
              cpf_number: "333.444.555-99",
              birth_date: "1994-04-14",
            },
          ],
        }),
      },
    )
    expect(regResponse.status).toBe(201)
    const regData = await regResponse.json()
    const testSaleId = regData.saleId

    // Cancel this sale
    const cancelResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${testSaleId}?send_email=false`,
      {
        method: "DELETE",
        headers: { Cookie: `session_id=${adminToken}` },
      },
    )
    expect(cancelResponse.status).toBe(204)

    // Try to update question response
    const patchResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${testSaleId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          checkout_question_response: "Não",
          send_email: false,
        }),
      },
    )
    expect(patchResponse.status).toBe(400)
    const patchData = await patchResponse.json()
    expect(patchData.message).toBe(
      "Não é possível alterar a resposta da pergunta de uma inscrição cancelada.",
    )
  })
})
