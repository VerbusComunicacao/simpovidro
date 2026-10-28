import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("POST /api/v1/lunch-registrations and /lookup", () => {
  let adminUser
  let regularUser1
  let regularUser2
  let activeHotel
  let room
  let confirmedCpf1 = "52998224725"
  let confirmedCpf2 = "11144477735"
  let guest1
  let guest2
  let sale1
  let sale2
  let availableLunches = []

  beforeAll(async () => {
    // 1. Create Admin
    adminUser = await orchestrator.createUser({
      full_name: "Admin Almoço Test",
      email: "admin-almoco@example.com",
      password: "password123",
    })
    await orchestrator.activateAdmUser(adminUser.id)
    await orchestrator.setUserFeatures(adminUser.id, [
      "create:session",
      "read:session",
      "read:sale:others",
    ])

    // 2. Create Active Hotel
    activeHotel = await orchestrator.createHotel(adminUser.id, {
      name: "Costão do Santinho - Simpovidro",
      city: "Florianópolis",
      country: "Brasil",
      check_in_date: "2026-11-05",
      check_out_date: "2026-11-08",
    })
    await orchestrator.activateHotel(activeHotel.id)

    // 3. Create Room in Active Hotel
    room = await orchestrator.createRoom(adminUser.id, {
      hotel_id: activeHotel.id,
      total_rooms: 20,
      available_rooms: 20,
    })

    // 4. Create Regular User 1
    regularUser1 = await orchestrator.createUser({
      full_name: "Participante Um",
      email: "participante1@example.com",
      password: "password123",
    })
    await orchestrator.activateUser(regularUser1.id)

    const regResult1 = await orchestrator.createRegistration(regularUser1.id, {
      room_id: room.id,
      guests_data: [
        {
          name: "Participante Um",
          badge_name: "Um",
          email: "participante1@example.com",
          phone: "11988887771",
          gender: "Masculino",
          rg_number: "123456781",
          cpf_number: confirmedCpf1,
          birth_date: "1990-05-15",
        },
      ],
    })
    sale1 = { id: regResult1.saleId }
    guest1 = { id: regResult1.guestIds[0] }

    // 5. Create Regular User 2
    regularUser2 = await orchestrator.createUser({
      full_name: "Participante Dois",
      email: "participante2@example.com",
      password: "password123",
    })
    await orchestrator.activateUser(regularUser2.id)

    const regResult2 = await orchestrator.createRegistration(regularUser2.id, {
      room_id: room.id,
      guests_data: [
        {
          name: "Participante Dois",
          badge_name: "Dois",
          email: "participante2@example.com",
          phone: "11988887772",
          gender: "Feminino",
          rg_number: "123456782",
          cpf_number: confirmedCpf2,
          birth_date: "1992-08-20",
        },
      ],
    })
    sale2 = { id: regResult2.saleId }
    guest2 = { id: regResult2.guestIds[0] }

    // 6. Create Foreign User with numeric passport 1313131
    const foreignUser = await orchestrator.createUser({
      full_name: "John Foreigner",
      email: "foreigner@example.com",
      password: "password123",
    })
    await orchestrator.activateUser(foreignUser.id)

    await orchestrator.createRegistration(foreignUser.id, {
      room_id: room.id,
      guests_data: [
        {
          name: "John Foreigner",
          badge_name: "John",
          email: "foreigner@example.com",
          phone: "+15551234567",
          gender: "Masculino",
          passport_number: "1313131",
          birth_date: "1985-08-20",
        },
      ],
    })
  })

  test("GET /api/v1/lunches should return active lunch tables", async () => {
    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/lunches?hotel_id=${activeHotel.id}`,
    )
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThanOrEqual(5)
    availableLunches = data

    const titles = data.map((l) => l.title)
    expect(titles).toContain("Clínica de Gestão e Mudança, Além do Vidro")
    expect(titles).toContain("Energia")
    expect(titles).toContain("Mercado Global")
    expect(titles).toContain("Inteligência Artificial")
    expect(titles).toContain("Reforma Tributária")
  })

  test("POST /api/v1/lunch-registrations/lookup with invalid or non-existent document", async () => {
    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/lunch-registrations/lookup`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: "00000000000" }),
      },
    )
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.found).toBe(false)
    expect(data.message).toBeDefined()
  })

  test("POST /api/v1/lunch-registrations/lookup with valid confirmed CPF", async () => {
    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/lunch-registrations/lookup`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: confirmedCpf1 }),
      },
    )
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.found).toBe(true)
    expect(data.participant).toBeDefined()
    expect(data.participant.participant_name).toBe("Participante Um")
    expect(data.participant.guest_id).toBe(guest1.id)
    expect(data.participant.sale_id).toBe(sale1.id)
    expect(Array.isArray(data.available_lunches)).toBe(true)
    expect(data.existing_registration).toBeNull()
  })

  test("POST /api/v1/lunch-registrations/lookup with numeric foreign passport 1313131", async () => {
    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/lunch-registrations/lookup`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: "1313131" }),
      },
    )
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.found).toBe(true)
    expect(data.document_type).toBe("passport")
    expect(data.participant).toBeDefined()
    expect(data.participant.participant_name).toBe("John Foreigner")
    expect(data.participant.passport_number).toBe("1313131")
  })

  test("POST /api/v1/lunch-registrations/lookup with numeric foreign passport formatted with dots 131.313.1", async () => {
    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/lunch-registrations/lookup`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: "131.313.1" }),
      },
    )
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.found).toBe(true)
    expect(data.document_type).toBe("passport")
    expect(data.participant).toBeDefined()
    expect(data.participant.participant_name).toBe("John Foreigner")
    expect(data.participant.passport_number).toBe("1313131")
  })

  test("POST /api/v1/lunch-registrations - Participant 1 registers for first table and gets position 1", async () => {
    const targetLunch = availableLunches[0]

    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/lunch-registrations`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_id: guest1.id,
          sale_id: sale1.id,
          lunch_id: targetLunch.id,
        }),
      },
    )
    expect(response.status).toBe(201)

    const data = await response.json()
    expect(data.registration).toBeDefined()
    expect(data.registration.lunch_id).toBe(targetLunch.id)
    expect(data.position).toBe(1)
    expect(data.lunch.title).toBe(targetLunch.title)
  })

  test("POST /api/v1/lunch-registrations - Participant 2 registers for the SAME table and gets position 2 (queue order)", async () => {
    const targetLunch = availableLunches[0]

    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/lunch-registrations`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_id: guest2.id,
          sale_id: sale2.id,
          lunch_id: targetLunch.id,
        }),
      },
    )
    expect(response.status).toBe(201)

    const data = await response.json()
    expect(data.registration).toBeDefined()
    expect(data.registration.lunch_id).toBe(targetLunch.id)
    expect(data.position).toBe(2)
  })

  test("POST /api/v1/lunch-registrations/lookup shows existing registration with queue position", async () => {
    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/lunch-registrations/lookup`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: confirmedCpf2 }),
      },
    )
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.found).toBe(true)
    expect(data.existing_registration).toBeDefined()
    expect(data.existing_registration.position).toBe(2)
  })

  test("POST /api/v1/lunch-registrations - Participant 2 switches to another table (updates choice)", async () => {
    const newTargetLunch = availableLunches[1]

    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/lunch-registrations`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_id: guest2.id,
          sale_id: sale2.id,
          lunch_ids: [newTargetLunch.id],
        }),
      },
    )
    expect(response.status).toBe(201)

    const data = await response.json()
    expect(data.registration.lunch_id).toBe(newTargetLunch.id)
    expect(data.position).toBe(1) // First one in table 2!
  })

  test("GET /api/v1/reports?type=lunches returns accurate chronological list", async () => {
    const adminSession = await orchestrator.createSession(adminUser.id)

    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/reports?type=lunches&hotel_id=${activeHotel.id}`,
      {
        headers: {
          cookie: `session_id=${adminSession.token}`,
        },
      },
    )
    expect(response.status).toBe(200)

    const reportData = await response.json()
    expect(Array.isArray(reportData)).toBe(true)
    expect(reportData.length).toBe(2)

    const p1 = reportData.find((r) => r["Nome Completo"] === "Participante Um")
    const p2 = reportData.find(
      (r) => r["Nome Completo"] === "Participante Dois",
    )
    expect(p1).toBeDefined()
    expect(p2).toBeDefined()
    expect(p1["CPF"]).toBe(confirmedCpf1)
    expect(p2["CPF"]).toBe(confirmedCpf2)
  })
})
