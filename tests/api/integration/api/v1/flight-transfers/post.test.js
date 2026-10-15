import { version as uuidVersion } from "uuid"
import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("POST /api/v1/flight-transfers", () => {
  let adminUser
  let hotelId
  let registeredUser
  let registeredCpf = "41998224729"

  beforeAll(async () => {
    // 1. Create Admin
    adminUser = await orchestrator.createUser({
      full_name: "Admin Transfer User",
      email: "admin-transfer@example.com",
      password: "password123",
    })
    await orchestrator.activateAdmUser(adminUser.id)

    // 2. Create and Activate Hotel
    const hotel = await orchestrator.createHotel(adminUser.id, {
      name: "Hotel Transfer Test",
      city: "Maceió",
      country: "Brasil",
      check_in_date: "2026-11-01",
      check_out_date: "2026-11-05",
    })
    hotelId = hotel.id
    await orchestrator.activateHotel(hotelId)

    // 3. Create room and a confirmed registration with a guest
    const room = await orchestrator.createRoom(adminUser.id, {
      hotel_id: hotelId,
    })

    registeredUser = await orchestrator.createUser({
      full_name: "Inscrito Transfer",
      email: "inscrito-transfer@example.com",
      password: "password123",
    })
    await orchestrator.activateUser(registeredUser.id)

    await orchestrator.createRegistration(registeredUser.id, {
      room_id: room.id,
      guests_data: [
        {
          name: "Inscrito Transfer",
          badge_name: "Inscrito",
          email: "inscrito-transfer@example.com",
          phone: "11988887777",
          gender: "Masculino",
          rg_number: "123456789",
          cpf_number: registeredCpf,
          birth_date: "1990-01-01",
        },
      ],
    })
  })

  describe("Anonymous user", () => {
    test("Should return 400 when unauthenticated participant has no linked registration", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/flight-transfers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            participant_name: "Carlos Sem Inscricao",
            participant_cpf: "000.000.000-00",
            in_airline: "LATAM",
            in_locator: "ABC123",
          }),
        },
      )

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.message).toContain("não vinculado a uma inscrição")
    })

    test("Should register flight transfer when unauthenticated participant has a confirmed registration", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/flight-transfers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            hotel_id: hotelId,
            participant_name: "Inscrito Transfer",
            participant_cpf: registeredCpf,
            participant_email: "inscrito-transfer@example.com",
            in_date: "01/11/2026",
            in_airline: "GOL",
            in_locator: "GOL789",
            in_flight_number: "G3 1500",
            in_arrival_time: "12:00",
            out_date: "05/11/2026",
            out_airline: "AZUL",
            out_locator: "AZU456",
            out_flight_number: "AD 2200",
            out_departure_time: "16:00",
            notes: "Transfer público sem login",
          }),
        },
      )

      expect(response.status).toBe(201)
      const body = await response.json()
      expect(uuidVersion(body.id)).toBe(4)
      expect(body.user_id).toBe(registeredUser.id)
      expect(body.hotel_id).toBe(hotelId)
      expect(body.participant_name).toBe("Inscrito Transfer")
      expect(body.in_airline).toBe("GOL")
      expect(body.in_locator).toBe("GOL789")
      expect(body.out_airline).toBe("AZUL")
      expect(body.notes).toBe("Transfer público sem login")
    })
  })

  describe("Authenticated user", () => {
    let userToken
    let userId

    beforeAll(async () => {
      const user = await orchestrator.createUser({
        full_name: "Participante Voo",
        email: "participante-voo@example.com",
        password: "password123",
      })
      await orchestrator.activateUser(user.id)
      const session = await orchestrator.createSession(user.id)
      userToken = session.token
      userId = user.id
    })

    test("Should register flight transfer with all fields successfully", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/flight-transfers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${userToken}`,
          },
          body: JSON.stringify({
            hotel_id: hotelId,
            participant_name: "Fernando Silva",
            participant_cpf: "123.456.789-00",
            participant_email: "fernando@vidros.com.br",
            participant_phone: "(11) 98888-7777",
            company_name: "Vidraçaria Silva",
            in_date: "01/11/2026",
            in_airline: "LATAM",
            in_locator: "LAT123",
            in_flight_number: "LA 3400",
            in_origin_airport: "GRU",
            in_arrival_time: "14:30",
            in_destination_airport: "MCZ",
            out_date: "05/11/2026",
            out_airline: "GOL",
            out_locator: "GOL456",
            out_flight_number: "G3 1200",
            out_departure_airport: "MCZ",
            out_departure_time: "18:00",
            out_destination_airport: "GRU",
            notes: "Necessidade de bagagem extra",
          }),
        },
      )

      expect(response.status).toBe(201)
      const body = await response.json()

      expect(uuidVersion(body.id)).toBe(4)
      expect(body.user_id).toBe(userId)
      expect(body.hotel_id).toBe(hotelId)
      expect(body.participant_name).toBe("Fernando Silva")
      expect(body.in_airline).toBe("LATAM")
      expect(body.in_locator).toBe("LAT123")
      expect(body.in_arrival_time).toBe("14:30")
      expect(body.out_airline).toBe("GOL")
      expect(body.out_locator).toBe("GOL456")
      expect(body.out_departure_time).toBe("18:00")
      expect(body.notes).toBe("Necessidade de bagagem extra")
    })

    test("Should return 400 when participant_name is missing", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/flight-transfers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${userToken}`,
          },
          body: JSON.stringify({
            participant_name: "",
            in_airline: "LATAM",
          }),
        },
      )

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.message).toContain("nome do participante é obrigatório")
    })

    test("Should register flight transfers in batch (multiple participants)", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/flight-transfers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${userToken}`,
          },
          body: JSON.stringify({
            hotel_id: hotelId,
            participants: [
              {
                participant_name: "Hóspede 1",
                participant_cpf: "111.222.333-44",
                participant_email: "hospede1@teste.com",
              },
              {
                participant_name: "Hóspede 2",
                participant_cpf: "555.666.777-88",
                participant_email: "hospede2@teste.com",
              },
            ],
            in_airline: "Azul",
            in_flight_number: "AD 4500",
            in_locator: "AZU111",
          }),
        },
      )

      expect(response.status).toBe(201)
      const body = await response.json()
      expect(Array.isArray(body)).toBe(true)
      expect(body.length).toBe(2)
      expect(body[0].participant_name).toBe("Hóspede 1")
      expect(body[1].participant_name).toBe("Hóspede 2")
      expect(body[0].in_locator).toBe("AZU111")
      expect(body[1].in_locator).toBe("AZU111")
    })
  })
})
