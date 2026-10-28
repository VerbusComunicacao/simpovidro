import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("POST /api/v1/flight-transfers/lookup", () => {
  let adminUser
  let regularUser
  let activeHotel
  let room
  let confirmedCpf = "52998224725"
  let foreignPassport = "FP98765432"

  beforeAll(async () => {
    // 1. Create Admin
    adminUser = await orchestrator.createUser({
      full_name: "Admin Lookup Test",
      email: "admin-lookup@example.com",
      password: "password123",
    })
    await orchestrator.activateAdmUser(adminUser.id)

    // 2. Create Active Hotel
    activeHotel = await orchestrator.createHotel(adminUser.id, {
      name: "Hotel Simpovidro Oficial",
      city: "Maceió",
      country: "Brasil",
      check_in_date: "2026-11-01",
      check_out_date: "2026-11-05",
    })
    await orchestrator.activateHotel(activeHotel.id)

    // 3. Create Room in Active Hotel
    room = await orchestrator.createRoom(adminUser.id, {
      hotel_id: activeHotel.id,
      total_rooms: 10,
      available_rooms: 5,
      blocked_rooms: 0,
    })

    // 4. Create Regular User with Confirmed Registration (Brazilian Guest)
    regularUser = await orchestrator.createUser({
      full_name: "Participante Inscrito",
      email: "participante-inscrito@example.com",
      password: "password123",
    })
    await orchestrator.activateUser(regularUser.id)

    await orchestrator.createRegistration(regularUser.id, {
      room_id: room.id,
      guests_data: [
        {
          name: "Participante Inscrito",
          badge_name: "Inscrito",
          email: "participante-inscrito@example.com",
          phone: "11988887777",
          gender: "Masculino",
          rg_number: "123456789",
          cpf_number: confirmedCpf,
          birth_date: "1990-05-15",
        },
      ],
    })

    // 5. Create Foreign User with Confirmed Registration (Passport Guest)
    const foreignUser = await orchestrator.createUser({
      full_name: "John Foreigner",
      email: "john-foreigner@example.com",
      password: "password123",
    })
    await orchestrator.activateUser(foreignUser.id)

    await orchestrator.createRegistration(foreignUser.id, {
      room_id: room.id,
      guests_data: [
        {
          name: "John Foreigner",
          badge_name: "John",
          email: "john-foreigner@example.com",
          phone: "+15551234567",
          gender: "Masculino",
          passport_number: foreignPassport,
          birth_date: "1985-08-20",
        },
      ],
    })
  })

  describe("Sad paths (Validation & Not Found)", () => {
    test("Should return 400 when document is not provided", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/flight-transfers/lookup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      )

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.name).toBe("ValidationError")
      expect(body.message).toContain("Informe o CPF ou Passaporte")
    })

    test("Should return 400 when document is an empty string", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/flight-transfers/lookup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ document: "   " }),
        },
      )

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.name).toBe("ValidationError")
    })

    test("Should return found: false when document is not registered in the active hotel", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/flight-transfers/lookup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ document: "00000000000" }),
        },
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.found).toBe(false)
      expect(body.message).toContain("Nenhuma inscrição confirmada encontrada")
      expect(body.hotel).toBeDefined()
      expect(body.hotel.id).toBe(activeHotel.id)
    })
  })

  describe("Happy paths (Lookup participant)", () => {
    test("Should find participant by plain CPF", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/flight-transfers/lookup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ document: confirmedCpf }),
        },
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.found).toBe(true)
      expect(body.document_type).toBe("cpf")
      expect(body.participant).toBeDefined()
      expect(body.participant.participant_name).toBe("Participante Inscrito")
      expect(body.participant.participant_email).toBe(
        "participante-inscrito@example.com",
      )
      expect(body.participant.user_id).toBe(regularUser.id)
      expect(body.hotel.id).toBe(activeHotel.id)
    })

    test("Should find participant by formatted CPF (with punctuation)", async () => {
      // 529.982.247-25
      const formattedCpf = "529.982.247-25"
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/flight-transfers/lookup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ document: formattedCpf }),
        },
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.found).toBe(true)
      expect(body.participant.participant_name).toBe("Participante Inscrito")
    })

    test("Should find foreign participant by passport number", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/flight-transfers/lookup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ document: foreignPassport }),
        },
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.found).toBe(true)
      expect(body.document_type).toBe("passport")
      expect(body.participant.participant_name).toBe("John Foreigner")
      expect(body.participant.passport_number).toBe(foreignPassport)
    })

    test("Should return existing_transfer if participant has already submitted flight transfer", async () => {
      // 1. Submit a flight transfer for this participant
      const transferRes = await fetch(
        `${orchestrator.webserverUrl}/api/v1/flight-transfers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hotel_id: activeHotel.id,
            participant_name: "Participante Inscrito",
            participant_cpf: confirmedCpf,
            in_airline: "GOL",
            in_locator: "ABC111",
            in_date: "01/11/2026",
            in_arrival_time: "10:00",
            out_airline: "LATAM",
            out_locator: "XYZ222",
            out_date: "05/11/2026",
            out_departure_time: "17:00",
          }),
        },
      )
      expect(transferRes.status).toBe(201)

      // 2. Lookup again and verify existing_transfer is returned
      const lookupRes = await fetch(
        `${orchestrator.webserverUrl}/api/v1/flight-transfers/lookup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ document: confirmedCpf }),
        },
      )

      expect(lookupRes.status).toBe(200)
      const lookupBody = await lookupRes.json()
      expect(lookupBody.found).toBe(true)
      expect(lookupBody.existing_transfer).toBeDefined()
      expect(lookupBody.existing_transfer.in_locator).toBe("ABC111")
      expect(lookupBody.existing_transfer.out_locator).toBe("XYZ222")
    })
  })
})
