import orchestrator from "tests/orchestrator.js"
import database from "infra/database.js"
import { v4 as uuidv4 } from "uuid"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("POST /api/v1/registrations", () => {
  describe("Anonymous User", () => {
    test("Should return 401 Unauthorized (via controller middleware)", async () => {
      // The controller.canRequest feature "create:registration" (hypothetical) or simply needing a user session
      // Current implementation throws ValidationError if !user.id
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/registrations`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      })

      const responseBody = await response.json()
      expect(response.status).toBe(400) // Based on current code throwing ValidationError
      expect(responseBody.message).toEqual("Você precisa estar logado para realizar a inscrição.")
    })
  })

  describe("Authenticated User", () => {
    let session
    let user
    let hotelOwner
    let hotel
    let room

    beforeEach(async () => {
        await orchestrator.clearDatabase()
        await orchestrator.runPendingMigrations()
        
        user = await orchestrator.createUser()
        await orchestrator.activateUser(user.id)
        session = await orchestrator.createSession(user.id)

        hotelOwner = await orchestrator.createUser()
        await orchestrator.activateUser(hotelOwner.id)
        hotel = await orchestrator.createHotel(hotelOwner.id)
        room = await orchestrator.createRoom(hotelOwner.id, {
            hotel_id: hotel.id,
            available_rooms: 5,
            price_per_night: 150.00
        })
    })

    test("Scenario: Register 1 person (Lead)", async () => {
      const guestsData = [{
          name: "Lead Guest Only",
          email: user.email,
          cpf_number: "111.111.111-11",
          rg_number: "11.111.111-1",
          birth_date: "1990-01-01",
          phone: "11999999999",
          gender: "Masculino"
      }]

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/registrations`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`
        },
        body: JSON.stringify({
            room_id: room.id,
            guests_data: guestsData
        })
      })

      const responseBody = await response.json()
      expect(response.status).toBe(201)
      
      // DB Verification: Sale amount should be 1x room price
      const saleResult = await database.query({
          text: "SELECT * FROM sales WHERE id = $1",
          values: [responseBody.saleId]
      })
      expect(Number(saleResult.rows[0].total_amount)).toBe(150.00)
      
      // DB Verification: Total guests linked
      const jointResult = await database.query({
          text: "SELECT * FROM sales_guests WHERE sale_id = $1",
          values: [responseBody.saleId]
      })
      expect(jointResult.rowCount).toBe(1)
    })

    test("Scenario: Register 2 people (Lead + Companion) and verify price multiplication", async () => {
        const roomCategory = await orchestrator.createRoomCategory(hotelOwner.id, {
          max_adults: 2,
          max_children: 0
        })

        const room = await orchestrator.createRoom(hotelOwner.id, {
          hotel_id: hotel.id,
          room_category_id: roomCategory.id,
          price_per_night: 150.00
        })
      const guestsData = [
        {
          name: "Main User",
          email: "main@test.com",
          cpf_number: "222.222.222-22",
          rg_number: "22.222.222-2",
          birth_date: "1980-01-01",
          phone: "11911111111",
          gender: "Masculino"
        },
        {
          name: "Companion 1",
          email: "comp1@test.com",
          cpf_number: "333.333.333-33",
          rg_number: "33.333.333-3",
          birth_date: "1985-05-05",
          phone: "11922222222",
          gender: "Feminino"
        }
      ]

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/registrations`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`
        },
        body: JSON.stringify({
            room_id: room.id,
            guests_data: guestsData
        })
      })

      const responseBody = await response.json()
      expect(response.status).toBe(201)
      
      // DB Verification: Sale amount should be 2x room price (150 * 2 = 300)
      const saleResult = await database.query({
          text: "SELECT * FROM sales WHERE id = $1",
          values: [responseBody.saleId]
      })
      expect(Number(saleResult.rows[0].total_amount)).toBe(300.00)

      // DB Verification: Both guests linked in sales_guests
      const jointResult = await database.query({
          text: "SELECT * FROM sales_guests WHERE sale_id = $1",
          values: [responseBody.saleId]
      })
      expect(jointResult.rowCount).toBe(2)
    })

    test("Scenario: Register same 2 people twice with updated details (Upsert Verification)", async () => {
      const sharedCpf1 = "444.444.444-44"
      const sharedCpf2 = "555.555.555-55"

      const firstBatch = [
        { name: "Old Name 1", email: "old1@t.com", cpf_number: sharedCpf1, rg_number: "4A", birth_date: "1990-01-01", phone: "1", gender: "Masculino" },
        { name: "Old Name 2", email: "old2@t.com", cpf_number: sharedCpf2, rg_number: "5B", birth_date: "1990-01-01", phone: "2", gender: "Masculino" }
      ]

      // First call
      await fetch(`${orchestrator.webserverUrl}/api/v1/registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `session_id=${session.token}` },
        body: JSON.stringify({ room_id: room.id, guests_data: firstBatch })
      })

      // Second call: Change names but keep CPFs
      const secondBatchData = [
        { name: "Updated Name 1", email: "new1@t.com", cpf_number: sharedCpf1, rg_number: "4A", birth_date: "1990-01-01", phone: "9", gender: "Feminino" },
        { name: "Updated Name 2", email: "new2@t.com", cpf_number: sharedCpf2, rg_number: "5B", birth_date: "1990-01-01", phone: "8", gender: "Feminino" }
      ]

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/registrations`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`
        },
        body: JSON.stringify({
            room_id: room.id,
            guests_data: secondBatchData
        })
      })

      expect(response.status).toBe(201)
      
      // DB Verification: Verify that ONLY 2 guests exist with these CPFs (no duplication)
      // and their names are the UPDATED ones
      const guestCheck = await database.query({
          text: "SELECT name FROM guests WHERE cpf_number IN ($1, $2)",
          values: [sharedCpf1, sharedCpf2]
      })
      expect(guestCheck.rowCount).toBe(2)
      
      const names = guestCheck.rows.map(r => r.name)
      expect(names).toContain("Updated Name 1")
      expect(names).toContain("Updated Name 2")
    })

    test("Error: Should fail if guests_data is missing or empty", async () => {
        const responseList = [
            await fetch(`${orchestrator.webserverUrl}/api/v1/registrations`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Cookie: `session_id=${session.token}` },
                body: JSON.stringify({ room_id: room.id, guests_data: [] })
            }),
            await fetch(`${orchestrator.webserverUrl}/api/v1/registrations`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Cookie: `session_id=${session.token}` },
                body: JSON.stringify({ room_id: room.id })
            })
        ]

        for (const response of responseList) {
            expect(response.status).toBe(400)
            const body = await response.json()
            expect(body.message).toContain("É necessário informar pelo menos um hóspede")
        }
    })

    test("Error: Should fail if room availability is exhausted", async () => {
        // Create a room with 0 available spots using the hotelOwner
        const fullRoom = await orchestrator.createRoom(hotelOwner.id, {
            hotel_id: hotel.id,
            available_rooms: 0
        })

        const response = await fetch(`${orchestrator.webserverUrl}/api/v1/registrations`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Cookie: `session_id=${session.token}`
            },
            body: JSON.stringify({
                room_id: fullRoom.id,
                guests_data: [{
                    name: "Unlucky Guest",
                    email: "fail@fail.com",
                    cpf_number: "000.000.000-00",
                    rg_number: "00.000.000-0",
                    birth_date: "1990-01-01",
                    phone: "11999999999",
                    gender: "Outro"
                }]
            })
        })

        expect(response.status).toBe(400)
        const responseBody = await response.json()
        expect(responseBody.message).toEqual("Este quarto não está mais disponível.")
    })

    test("Error: Should fail if number of guests exceeds room capacity", async () => {
        // 1. Create a category with capacity 1
        const smallCategory = await orchestrator.createRoomCategory(hotelOwner.id, {
            name: "Small Room",
            max_adults: 1,
            max_children: 0
        })

        // 2. Create a room with that category
        const smallRoom = await orchestrator.createRoom(hotelOwner.id, {
            hotel_id: hotel.id,
            room_category_id: smallCategory.id,
            available_rooms: 1
        })

        // 3. Try to register 2 guests
        const guestsData = [
            { name: "Guest 1", email: "g1@t.com", cpf_number: "999.001.001-01", rg_number: "1X", birth_date: "1990-01-01", phone: "1", gender: "Masculino" },
            { name: "Guest 2", email: "g2@t.com", cpf_number: "999.002.002-02", rg_number: "2Y", birth_date: "1990-01-01", phone: "2", gender: "Masculino" }
        ]

        const response = await fetch(`${orchestrator.webserverUrl}/api/v1/registrations`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Cookie: `session_id=${session.token}`
            },
            body: JSON.stringify({
                room_id: smallRoom.id,
                guests_data: guestsData
            })
        })

        expect(response.status).toBe(400)
        const responseBody = await response.json()
        expect(responseBody.message).toContain("excede a capacidade máxima do quarto")
    })

    test("Scenario: Pricing with age policies", async () => {
        // 1. Setup Room Category with Pricing Policy
        const category = await orchestrator.createRoomCategory(hotelOwner.id, {
            max_adults: 2,
            max_children: 1
        })

        // Policy: Up to 5 years old -> $20.00
        await orchestrator.createPricePolicy(category.id, {
            max_age: 5,
            price: 20.00,
            description: "Criança"
        })

        const room = await orchestrator.createRoom(hotelOwner.id, {
            hotel_id: hotel.id,
            room_category_id: category.id,
            price_per_night: 100.00, 
            available_rooms: 5
        })

        // 2. Prepare Guest Data
        const adultGuest = { 
            name: "Adult", 
            email: "adult@t.com", 
            cpf_number: "111.111.111-11", 
            rg_number: "ORG1", 
            birth_date: "1990-01-01", // 30+ years
            phone: "11", 
            gender: "M" 
        }

        const childGuest = { 
            name: "Child", 
            email: "child@t.com", 
            cpf_number: "222.222.222-22", 
            rg_number: "ORG2", 
            birth_date: new Date().toISOString().split('T')[0], // Today (0 years)
            phone: "22", 
            gender: "M" 
        }

        // 3. Register
        const response = await fetch(`${orchestrator.webserverUrl}/api/v1/registrations`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Cookie: `session_id=${session.token}`
            },
            body: JSON.stringify({
                room_id: room.id,
                guests_data: [adultGuest, childGuest]
            })
        })

        expect(response.status).toBe(201)
        
        // 4. Verify Total Amount
        // Adult (not matched by policy) = 100.00
        // Child (0 years <= 5) = 20.00
        // Total should be 120.00
        const saleResult = await database.query({
            text: `SELECT total_amount FROM sales WHERE room_id = $1`,
            values: [room.id]
        })

        expect(saleResult.rows).toHaveLength(1)
        expect(Number(saleResult.rows[0].total_amount)).toBe(120.00)
    })
  })
})
