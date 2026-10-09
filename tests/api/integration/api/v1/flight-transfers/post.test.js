import { version as uuidVersion } from "uuid"
import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("POST /api/v1/flight-transfers", () => {
  describe("Anonymous user", () => {
    test("Should return 401 when unauthenticated", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/flight-transfers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            participant_name: "Carlos Teste",
            in_airline: "LATAM",
            in_locator: "ABC123",
          }),
        },
      )

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.name).toBe("UnauthorizedError")
    })
  })

  describe("Authenticated user", () => {
    let userToken
    let userId
    let hotelId

    beforeAll(async () => {
      const adminUser = await orchestrator.createUser({
        full_name: "Admin Transfer User",
        email: "admin-transfer@example.com",
        password: "password123",
      })
      await orchestrator.activateAdmUser(adminUser.id)
      const adminSession = await orchestrator.createSession(adminUser.id)

      // Create hotel
      const hotelRes = await fetch(
        `${orchestrator.webserverUrl}/api/v1/hotels`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${adminSession.token}`,
          },
          body: JSON.stringify({
            name: "Hotel Transfer Test",
            city: "Maceió",
            country: "Brasil",
            check_in_date: "2026-11-01",
            check_out_date: "2026-11-05",
          }),
        },
      )
      const hotelData = await hotelRes.json()
      hotelId = hotelData.id

      // Activate hotel
      await fetch(
        `${orchestrator.webserverUrl}/api/v1/hotels/${hotelId}/activate`,
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${adminSession.token}`,
          },
        },
      )

      // Regular user
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
