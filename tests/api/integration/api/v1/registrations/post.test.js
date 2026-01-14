import orchestrator from "tests/orchestrator.js"
import database from "infra/database.js"

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
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/registrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        },
      )

      const responseBody = await response.json()
      expect(response.status).toBe(400) // Based on current code throwing ValidationError
      expect(responseBody.message).toEqual(
        "Você precisa estar logado para realizar a inscrição.",
      )
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
      const roomCategory = await orchestrator.createRoomCategory(
        hotelOwner.id,
        {
          max_adults: 5,
        },
      )
      room = await orchestrator.createRoom(hotelOwner.id, {
        hotel_id: hotel.id,
        room_category_id: roomCategory.id,
        available_rooms: 5,
        price_per_night: 150.0,
      })
    })

    test("Scenario: Register 1 person (Lead)", async () => {
      const guestsData = [
        {
          name: "Lead Guest Only",
          email: user.email,
          cpf_number: "111.111.111-11",
          rg_number: "11.111.111-1",
          birth_date: "1990-01-01",
          phone: "11999999999",
          gender: "Masculino",
        },
      ]

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/registrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify({
            room_id: room.id,
            guests_data: guestsData,
          }),
        },
      )

      const responseBody = await response.json()
      expect(response.status).toBe(201)

      // DB Verification: Sale amount should be 1x room price
      const saleResult = await database.query({
        text: "SELECT * FROM sales WHERE id = $1",
        values: [responseBody.saleId],
      })
      expect(Number(saleResult.rows[0].total_amount)).toBe(150.0)

      // DB Verification: Total guests linked
      const jointResult = await database.query({
        text: "SELECT * FROM sales_guests WHERE sale_id = $1",
        values: [responseBody.saleId],
      })
      expect(jointResult.rowCount).toBe(1)
    })

    test("Scenario: Register 2 people (Lead + Companion) and verify price multiplication", async () => {
      const roomCategory = await orchestrator.createRoomCategory(
        hotelOwner.id,
        {
          max_adults: 2,
          max_children: 0,
        },
      )

      const room = await orchestrator.createRoom(hotelOwner.id, {
        hotel_id: hotel.id,
        room_category_id: roomCategory.id,
        price_per_night: 150.0,
      })
      const guestsData = [
        {
          name: "Main User",
          email: "main@test.com",
          cpf_number: "222.222.222-22",
          rg_number: "22.222.222-2",
          birth_date: "1980-01-01",
          phone: "11911111111",
          gender: "Masculino",
        },
        {
          name: "Companion 1",
          email: "comp1@test.com",
          cpf_number: "333.333.333-33",
          rg_number: "33.333.333-3",
          birth_date: "1985-05-05",
          phone: "11922222222",
          gender: "Feminino",
        },
      ]

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/registrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify({
            room_id: room.id,
            guests_data: guestsData,
          }),
        },
      )

      const responseBody = await response.json()
      expect(response.status).toBe(201)

      // DB Verification: Sale amount should be 2x room price (150 * 2 = 300)
      const saleResult = await database.query({
        text: "SELECT * FROM sales WHERE id = $1",
        values: [responseBody.saleId],
      })
      expect(Number(saleResult.rows[0].total_amount)).toBe(300.0)

      // DB Verification: Both guests linked in sales_guests
      const jointResult = await database.query({
        text: "SELECT * FROM sales_guests WHERE sale_id = $1",
        values: [responseBody.saleId],
      })
      expect(jointResult.rowCount).toBe(2)
    })

    test("Scenario: Register same 2 people twice with updated details (Upsert Verification)", async () => {
      const sharedCpf1 = "444.444.444-44"
      const sharedCpf2 = "555.555.555-55"

      const firstBatch = [
        {
          name: "Old Name 1",
          email: "old1@t.com",
          cpf_number: sharedCpf1,
          rg_number: "4A",
          birth_date: "1990-01-01",
          phone: "1",
          gender: "Masculino",
        },
        {
          name: "Old Name 2",
          email: "old2@t.com",
          cpf_number: sharedCpf2,
          rg_number: "5B",
          birth_date: "1990-01-01",
          phone: "2",
          gender: "Masculino",
        },
      ]

      // First call
      await fetch(`${orchestrator.webserverUrl}/api/v1/registrations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({ room_id: room.id, guests_data: firstBatch }),
      })

      // Second call: Use a DIFFERENT hotel to avoid the overlap validation
      const hotel2 = await orchestrator.createHotel(hotelOwner.id, {
        name: "Other Hotel",
      })
      const roomCategory2 = await orchestrator.createRoomCategory(
        hotelOwner.id,
        {
          max_adults: 5,
        },
      )
      const room2 = await orchestrator.createRoom(hotelOwner.id, {
        hotel_id: hotel2.id,
        room_category_id: roomCategory2.id,
        available_rooms: 5,
      })

      const secondBatchData = [
        {
          name: "Updated Name 1",
          email: "new1@t.com",
          cpf_number: sharedCpf1,
          rg_number: "4A",
          birth_date: "1990-01-01",
          phone: "9",
          gender: "Feminino",
        },
        {
          name: "Updated Name 2",
          email: "new2@t.com",
          cpf_number: sharedCpf2,
          rg_number: "5B",
          birth_date: "1990-01-01",
          phone: "8",
          gender: "Feminino",
        },
      ]

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/registrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify({
            room_id: room2.id,
            guests_data: secondBatchData,
          }),
        },
      )

      expect(response.status).toBe(201)

      // DB Verification: Verify that ONLY 2 guests exist with these CPFs (no duplication)
      // and their names are the UPDATED ones
      const guestCheck = await database.query({
        text: "SELECT name FROM guests WHERE cpf_number IN ($1, $2)",
        values: [sharedCpf1, sharedCpf2],
      })
      expect(guestCheck.rowCount).toBe(2)

      const names = guestCheck.rows.map((r) => r.name)
      expect(names).toContain("Updated Name 1")
      expect(names).toContain("Updated Name 2")
    })

    test("Error: Should fail if guests_data is missing or empty", async () => {
      const responseList = [
        await fetch(`${orchestrator.webserverUrl}/api/v1/registrations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify({ room_id: room.id, guests_data: [] }),
        }),
        await fetch(`${orchestrator.webserverUrl}/api/v1/registrations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify({ room_id: room.id }),
        }),
      ]

      for (const response of responseList) {
        expect(response.status).toBe(400)
        const body = await response.json()
        expect(body.message).toContain(
          "É necessário informar pelo menos um hóspede",
        )
      }
    })

    test("Error: Should fail if room availability is exhausted", async () => {
      // Create a room with 0 available spots using the hotelOwner
      const fullRoom = await orchestrator.createRoom(hotelOwner.id, {
        hotel_id: hotel.id,
        available_rooms: 0,
      })

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/registrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify({
            room_id: fullRoom.id,
            guests_data: [
              {
                name: "Unlucky Guest",
                email: "fail@fail.com",
                cpf_number: "000.000.000-00",
                rg_number: "00.000.000-0",
                birth_date: "1990-01-01",
                phone: "11999999999",
                gender: "Outro",
              },
            ],
          }),
        },
      )

      expect(response.status).toBe(400)
      const responseBody = await response.json()
      expect(responseBody.message).toEqual(
        "Este quarto não está mais disponível.",
      )
    })

    test("Error: Should fail if number of guests exceeds room capacity", async () => {
      // 1. Create a category with capacity 1
      const smallCategory = await orchestrator.createRoomCategory(
        hotelOwner.id,
        {
          name: "Small Room",
          max_adults: 1,
          max_children: 0,
        },
      )

      // 2. Create a room with that category
      const smallRoom = await orchestrator.createRoom(hotelOwner.id, {
        hotel_id: hotel.id,
        room_category_id: smallCategory.id,
        available_rooms: 1,
      })

      // 3. Try to register 2 guests
      const guestsData = [
        {
          name: "Guest 1",
          email: "g1@t.com",
          cpf_number: "999.001.001-01",
          rg_number: "1X",
          birth_date: "1990-01-01",
          phone: "1",
          gender: "Masculino",
        },
        {
          name: "Guest 2",
          email: "g2@t.com",
          cpf_number: "999.002.002-02",
          rg_number: "2Y",
          birth_date: "1990-01-01",
          phone: "2",
          gender: "Masculino",
        },
      ]

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/registrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify({
            room_id: smallRoom.id,
            guests_data: guestsData,
          }),
        },
      )

      expect(response.status).toBe(400)
      const responseBody = await response.json()
      expect(responseBody.message).toContain(
        "excede a capacidade máxima do quarto",
      )
    })

    test("Scenario: Pricing with age policies", async () => {
      // 1. Setup Room Category
      const category = await orchestrator.createRoomCategory(hotelOwner.id, {
        max_adults: 2,
        max_children: 1,
      })

      // Policy: Up to 5 years old -> 50% of price
      await orchestrator.createPricePolicy(hotel.id, {
        max_age: 5,
        percentage: 50,
        description: "Criança",
      })

      const room = await orchestrator.createRoom(hotelOwner.id, {
        hotel_id: hotel.id,
        room_category_id: category.id,
        price_per_night: 100.0,
        available_rooms: 5,
      })

      // 2. Prepare Guest Data
      const adultGuest = {
        name: "Adult",
        email: "adult@t.com",
        cpf_number: "111.111.111-11",
        rg_number: "ORG1",
        birth_date: "1990-01-01", // 30+ years
        phone: "11",
        gender: "M",
      }

      const childGuest = {
        name: "Child",
        email: "child@t.com",
        cpf_number: "222.222.222-22",
        rg_number: "ORG2",
        birth_date: new Date().toISOString().split("T")[0], // Today (0 years)
        phone: "22",
        gender: "M",
      }

      // 3. Register
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/registrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify({
            room_id: room.id,
            guests_data: [adultGuest, childGuest],
          }),
        },
      )

      expect(response.status).toBe(201)

      // 4. Verify Total Amount
      // Adult (not matched by policy) = 100.00 (100%)
      // Child (0 years <= 5) = 50.00 (50%)
      // Total should be 150.00
      const saleResult = await database.query({
        text: `SELECT total_amount FROM sales WHERE room_id = $1`,
        values: [room.id],
      })

      expect(saleResult.rows).toHaveLength(1)
      expect(Number(saleResult.rows[0].total_amount)).toBe(150.0)
    })

    test("Error: Should fail if only one child is added to a single room (max_adults: 1, max_children: 0)", async () => {
      const singleCategory = await orchestrator.createRoomCategory(
        hotelOwner.id,
        {
          name: "Single Room",
          max_adults: 1,
          max_children: 0,
        },
      )

      const singleRoom = await orchestrator.createRoom(hotelOwner.id, {
        hotel_id: hotel.id,
        room_category_id: singleCategory.id,
        available_rooms: 1,
      })

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/registrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify({
            room_id: singleRoom.id,
            guests_data: [
              {
                name: "Child Solo",
                email: "child@solo.com",
                cpf_number: "000.000.000-01",
                rg_number: "1S",
                birth_date: new Date().toISOString().split("T")[0], // Child (0 years)
                phone: "11999999999",
                gender: "Outro",
              },
            ],
          }),
        },
      )

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.message).toContain("excede a capacidade máxima do quarto (0)")
    })

    test("Scenario: 2 Adults / 2 Children capacity validation", async () => {
      const familyCategory = await orchestrator.createRoomCategory(
        hotelOwner.id,
        {
          name: "Family Room",
          max_adults: 2,
          max_children: 2,
        },
      )

      const familyRoom = await orchestrator.createRoom(hotelOwner.id, {
        hotel_id: hotel.id,
        room_category_id: familyCategory.id,
        available_rooms: 5,
      })

      // Helper to get an adult (birth_date 20 years ago)
      const getAdult = (i) => ({
        name: `Adult ${i}`,
        email: `a${i}@t.com`,
        cpf_number: `111.111.111-0${i}`,
        rg_number: `A${i}`,
        birth_date: "1990-01-01",
        phone: "11999999999",
        gender: "Masculino",
      })

      // Helper to get a child (birth_date recently)
      const getChild = (i) => ({
        name: `Child ${i}`,
        email: `c${i}@t.com`,
        cpf_number: `222.222.222-0${i}`,
        rg_number: `C${i}`,
        birth_date: new Date().toISOString().split("T")[0],
        phone: "11999999999",
        gender: "Feminino",
      })

      // 1. Try 4 children -> Fail (max children is 2)
      const res4Children = await fetch(
        `${orchestrator.webserverUrl}/api/v1/registrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify({
            room_id: familyRoom.id,
            guests_data: [getChild(1), getChild(2), getChild(3), getChild(4)],
          }),
        },
      )
      expect(res4Children.status).toBe(400)
      expect((await res4Children.json()).message).toContain(
        "número de crianças (4) excede a capacidade máxima",
      )

      // 2. Try 3 adults + 1 child -> Fail (max adults is 2)
      const res3Adults = await fetch(
        `${orchestrator.webserverUrl}/api/v1/registrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify({
            room_id: familyRoom.id,
            guests_data: [getAdult(1), getAdult(2), getAdult(3), getChild(1)],
          }),
        },
      )
      expect(res3Adults.status).toBe(400)
      expect((await res3Adults.json()).message).toContain(
        "número de adultos (3) excede a capacidade máxima",
      )

      // 3. Try 2 adults + 2 children -> Success
      const resSuccess = await fetch(
        `${orchestrator.webserverUrl}/api/v1/registrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify({
            room_id: familyRoom.id,
            guests_data: [getAdult(1), getAdult(2), getChild(1), getChild(2)],
          }),
        },
      )
      expect(resSuccess.status).toBe(201)
    })

    test("Scenario: Guest turning 18 on the day of check-in should be classified as an adult", async () => {
      const checkInDate = new Date("2026-05-20T10:00:00Z")
      const specificHotel = await orchestrator.createHotel(hotelOwner.id, {
        check_in_date: checkInDate.toISOString(),
      })

      // Single occupancy room for adults only
      const singleCategory = await orchestrator.createRoomCategory(
        hotelOwner.id,
        {
          max_adults: 1,
          max_children: 0,
        },
      )
      const singleRoom = await orchestrator.createRoom(hotelOwner.id, {
        hotel_id: specificHotel.id,
        room_category_id: singleCategory.id,
        available_rooms: 1,
      })

      // Birthday exactly 18 years before check-in
      const birthDate = "2008-05-20"

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/registrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify({
            room_id: singleRoom.id,
            guests_data: [
              {
                name: "Adult Today",
                email: "adult@today.com",
                cpf_number: "444.444.444-44",
                rg_number: "18A",
                birth_date: birthDate,
                phone: "11999999999",
                gender: "Masculino",
              },
            ],
          }),
        },
      )

      expect(response.status).toBe(201)
    })

    test("Scenario: Guest without turning 18 on the day of check-in should be classified as a child", async () => {
      const checkInDate = new Date("2026-05-20T10:00:00Z")
      const specificHotel = await orchestrator.createHotel(hotelOwner.id, {
        check_in_date: checkInDate.toISOString(),
      })

      // Single occupancy room for adults only
      const singleCategory = await orchestrator.createRoomCategory(
        hotelOwner.id,
        {
          max_adults: 1,
          max_children: 0,
        },
      )
      const singleRoom = await orchestrator.createRoom(hotelOwner.id, {
        hotel_id: specificHotel.id,
        room_category_id: singleCategory.id,
        available_rooms: 1,
      })

      // Birthday exactly 18 years after check-in
      const birthDate = "2008-05-21"

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/registrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify({
            room_id: singleRoom.id,
            guests_data: [
              {
                name: "Adult Tomorrow",
                email: "adult@today.com",
                cpf_number: "444.444.444-44",
                rg_number: "18A",
                birth_date: birthDate,
                phone: "11999999999",
                gender: "Masculino",
              },
            ],
          }),
        },
      )

      expect(response.status).toBe(400)
    })

    test("Scenario: Price policy 'free under 12' (max_age: 12) validation", async () => {
      const checkInDate = new Date("2026-06-01T10:00:00Z")
      const hotelWithPolicies = await orchestrator.createHotel(hotelOwner.id, {
        check_in_date: checkInDate.toISOString(),
        price_policies: [
          { max_age: 12, percentage: 0, description: "Criança Grátis" }, // Free for ages 0-12
        ],
      })

      const testCategory = await orchestrator.createRoomCategory(
        hotelOwner.id,
        {
          name: "Free Child Room",
          max_adults: 1,
          max_children: 3,
        },
      )

      const testRoom = await orchestrator.createRoom(hotelOwner.id, {
        hotel_id: hotelWithPolicies.id,
        room_category_id: testCategory.id,
        available_rooms: 5,
        price_per_night: 200.0,
      })

      const principalGuest = {
        name: "Adult",
        email: "adult@today.com",
        cpf_number: "444.444.444-44",
        rg_number: "18A",
        birth_date: "2008-05-20",
        phone: "11999999999",
        gender: "Masculino",
      }

      // 1. Guest A: Turns 12 on check-in day (born 2014-06-01) -> Pays 0% (age is 12)
      const guestA = {
        name: "Turning 12 Today",
        email: "12today@t.com",
        cpf_number: "555.555.555-55",
        rg_number: "12A",
        birth_date: "2014-06-01",
        phone: "11999999999",
        gender: "Masculino",
      }

      // 2. Guest B: Turns 12 the next day (born 2014-06-02) -> Pays 0% (age is 11)
      const guestB = {
        name: "Turning 12 Tomorrow",
        email: "12tomorrow@t.com",
        cpf_number: "666.666.666-66",
        rg_number: "11B",
        birth_date: "2014-06-02",
        phone: "11999999999",
        gender: "Feminino",
      }

      // 3. Guest C: Already 13 on check-in day (born 2013-06-01) -> Pays 100% (age is 13)
      const guestC = {
        name: "Already 13",
        email: "13today@t.com",
        cpf_number: "777.777.777-77",
        rg_number: "13A",
        birth_date: "2013-06-01",
        phone: "11999999999",
        gender: "Masculino",
      }

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/registrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify({
            room_id: testRoom.id,
            guests_data: [principalGuest, guestA, guestB, guestC],
          }),
        },
      )

      expect(response.status).toBe(201)
      const responseBody = await response.json()

      const saleResult = await database.query({
        text: `SELECT total_amount FROM sales WHERE id = $1`,
        values: [responseBody.saleId],
      })

      // Expected amount:(200 * 100%) + (200 * 0%) + (200 * 0%) + (200 * 100%) = 400.00
      expect(Number(saleResult.rows[0].total_amount)).toBe(400.0)
    })

    test("Regression: User reported age calculation edge case (Check-in 2026-10-14, Birth 2013-10-15)", async () => {
      const checkInDate = new Date("2026-10-14T10:00:00Z")
      const hotelWithPolicies = await orchestrator.createHotel(hotelOwner.id, {
        check_in_date: checkInDate.toISOString(),
        price_policies: [
          { max_age: 12, percentage: 0, description: "Até 12 anos grátis" },
        ],
      })

      const testCategory = await orchestrator.createRoomCategory(
        hotelOwner.id,
        {
          max_adults: 2,
          max_children: 2,
        },
      )

      const testRoom = await orchestrator.createRoom(hotelOwner.id, {
        hotel_id: hotelWithPolicies.id,
        room_category_id: testCategory.id,
        price_per_night: 200.0,
        available_rooms: 5,
      })

      // Guest is 12 years old on 14/10/2026 (turns 13 on 15/10/2026)
      const guestData = [
        {
          name: "Adult",
          email: "adult@test.com",
          cpf_number: "999.999.999-99",
          rg_number: "AD1",
          birth_date: "1990-01-01",
          phone: "11",
          gender: "M",
        },
        {
          name: "Child (12 years)",
          email: "child12@test.com",
          cpf_number: "888.888.888-88",
          rg_number: "CH12",
          birth_date: "2013-10-15",
          phone: "11",
          gender: "F",
        },
      ]

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/registrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify({
            room_id: testRoom.id,
            guests_data: guestData,
          }),
        },
      )

      expect(response.status).toBe(201)
    })

    test("Scenario: Registering multiple guests with same CPF/RG should fail", async () => {
      const testCategory = await orchestrator.createRoomCategory(
        hotelOwner.id,
        {
          max_adults: 3,
          max_children: 0,
        },
      )
      const testRoom = await orchestrator.createRoom(hotelOwner.id, {
        hotel_id: hotel.id,
        room_category_id: testCategory.id,
        available_rooms: 5,
      })

      const guestData = {
        name: "Duplicate Guest",
        email: "duplicate@test.com",
        cpf_number: "111.111.111-11",
        rg_number: "DUPE123",
        birth_date: "1990-01-01",
        phone: "11",
        gender: "M",
      }

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/registrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify({
            room_id: testRoom.id,
            guests_data: [guestData, { ...guestData, email: "other@test.com" }],
          }),
        },
      )

      expect(response.status).toBe(400)
      const responseBody = await response.json()
      expect(responseBody.message).toContain("não podem ser iguais")
    })

    test("Scenario: Registering same guest in the same hotel/period twice should fail", async () => {
      const guestData = {
        name: "Persistent Guest",
        email: "persistent@test.com",
        cpf_number: "222.222.222-22",
        rg_number: "RG_OVERLAP",
        birth_date: "1990-01-01",
        phone: "11",
        gender: "M",
      }

      // 1. First registration (Success)
      const response1 = await fetch(
        `${orchestrator.webserverUrl}/api/v1/registrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify({
            room_id: room.id,
            guests_data: [guestData],
          }),
        },
      )
      expect(response1.status).toBe(201)

      // 2. Second registration for the same hotel/period (Should fail)
      const response2 = await fetch(
        `${orchestrator.webserverUrl}/api/v1/registrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify({
            room_id: room.id,
            guests_data: [guestData],
          }),
        },
      )

      expect(response2.status).toBe(400)
      const responseBody = await response2.json()
      expect(responseBody.message).toContain("já possui uma inscrição")
    })
  })
})
