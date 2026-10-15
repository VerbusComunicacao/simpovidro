import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("GET /api/v1/flight-transfers/lookup", () => {
  let adminUser
  let regularUser
  let activeHotel
  let room
  let confirmedCpf = "61998224720"

  beforeAll(async () => {
    adminUser = await orchestrator.createUser({
      full_name: "Admin Lookup GET",
      email: "admin-lookup-get@example.com",
      password: "password123",
    })
    await orchestrator.activateAdmUser(adminUser.id)

    activeHotel = await orchestrator.createHotel(adminUser.id, {
      name: "Hotel Simpovidro GET",
      city: "Maceió",
      country: "Brasil",
      check_in_date: "2026-11-01",
      check_out_date: "2026-11-05",
    })
    await orchestrator.activateHotel(activeHotel.id)

    room = await orchestrator.createRoom(adminUser.id, {
      hotel_id: activeHotel.id,
    })

    regularUser = await orchestrator.createUser({
      full_name: "Participante GET",
      email: "participante-get@example.com",
      password: "password123",
    })
    await orchestrator.activateUser(regularUser.id)

    await orchestrator.createRegistration(regularUser.id, {
      room_id: room.id,
      guests_data: [
        {
          name: "Participante GET",
          badge_name: "GET",
          email: "participante-get@example.com",
          phone: "11977776666",
          gender: "Feminino",
          rg_number: "987654321",
          cpf_number: confirmedCpf,
          birth_date: "1992-03-10",
        },
      ],
    })
  })

  test("Should return 400 when document parameter is missing", async () => {
    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/flight-transfers/lookup`,
    )
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.name).toBe("ValidationError")
  })

  test("Should find participant via query param document", async () => {
    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/flight-transfers/lookup?document=${confirmedCpf}`,
    )
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.found).toBe(true)
    expect(body.participant.participant_name).toBe("Participante GET")
  })
})
