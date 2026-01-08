import orchestrator from "tests/orchestrator.js"
import { v4 as uuidv4 } from "uuid"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("POST /api/v1/registrations", () => {
  describe("Anonymous User", () => {
    test("Should return error", async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/registrations`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      })

      const responseBody = await response.json()
      expect(response.status).toBe(400)
      expect(responseBody.message).toEqual("Você precisa estar logado para realizar a inscrição.")
    })
  })

  describe("Authenticated User", () => {
    test("Should create guest and sale successfully", async () => {
      // 1. Setup Data
      const user = await orchestrator.createUser()
      await orchestrator.activateUser(user.id)
      const session = await orchestrator.createSession(user.id)

      const hotelOwner = await orchestrator.createUser()
      await orchestrator.activateUser(hotelOwner.id)
      const hotel = await orchestrator.createHotel(hotelOwner.id)
      const room = await orchestrator.createRoom(hotelOwner.id, {
          hotel_id: hotel.id,
          available_rooms: 5
      })

      // 2. Execute Request
      const guestData = {
          name: "Test Guest",
          email: user.email,
          cpf_number: "123.456.789-00",
          rg_number: "12.345.678-9",
          birth_date: "1990-01-01",
          phone: "11999999999",
          gender: "Masculino"
      }

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/registrations`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`
        },
        body: JSON.stringify({
            room_id: room.id,
            guest_data: guestData
        })
      })

      const responseBody = await response.json()

      if (response.status !== 201) {
        console.log("DEBUG: Response Body:", JSON.stringify(responseBody, null, 2))
      }

      // 3. Verify Response
      expect(response.status).toBe(201)
      expect(responseBody.saleId).toBeDefined()
      expect(responseBody.guestId).toBeDefined()
    })

    test("Should fail if room does not exist", async () => {
       const user = await orchestrator.createUser()
      await orchestrator.activateUser(user.id)
      const session = await orchestrator.createSession(user.id)
      
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/registrations`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`
        },
        body: JSON.stringify({
            room_id: uuidv4(),
            guest_data: {
          name: "Test Guest",
          email: user.email,
          cpf_number: "123.458.789-00",
          rg_number: "13.345.678-9",
          birth_date: "1990-01-01",
          phone: "11999999999",
          gender: "Masculino"
      }
        })
      })

      const responseBody = await response.json()

      expect(response.status).toBe(404)

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "Quarto não encontrado.",
        action: "Selecione outro quarto.",
        status_code: 404
      })
    })
  })
})
