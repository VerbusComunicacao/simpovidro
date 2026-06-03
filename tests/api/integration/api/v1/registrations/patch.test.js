import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("POST /api/v1/sales/[id]/replace-guest", () => {
  jest.useFakeTimers()

  afterAll(() => {
    jest.useRealTimers()
  })

  let adminToken
  let userToken
  let hotelId
  let roomId1
  let roomId2
  let guestCarla
  let guestFernando
  let guestAlessandra
  let saleId

  beforeAll(async () => {
    // 1. Create and Setup Admin User
    const adminUser = await orchestrator.createUser({
      full_name: "Admin User",
      email: "admin-patch@example.com",
      password: "password123",
    })
    await orchestrator.activateAdmUser(adminUser.id)
    const adminSession = await orchestrator.createSession(adminUser.id)
    adminToken = adminSession.token

    // 2. Create Regular User (without update:content)
    const regularUser = await orchestrator.createUser({
      full_name: "Regular User",
      email: "user-patch@example.com",
      password: "password123",
    })
    await orchestrator.activateUser(regularUser.id)
    await orchestrator.setUserFeatures(regularUser.id, [
      "create:session",
      "read:session",
      "read:content",
    ])
    const regularSession = await orchestrator.createSession(regularUser.id)
    userToken = regularSession.token

    // 3. Create a hotel (as admin)
    const hotelResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/hotels`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          name: "Test Hotel",
          city: "São Paulo",
          country: "Brasil",
          check_in_date: "2026-11-01",
          check_out_date: "2026-11-10",
        }),
      },
    )
    const hotelData = await hotelResponse.json()
    hotelId = hotelData.id

    // 4. Create a room type (as admin)
    const roomTypeResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/room-types`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({ name: "Double Room" }),
      },
    )
    const roomTypeData = await roomTypeResponse.json()

    // 5. Create a room category (as admin)
    const roomCategoryResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/room-categories`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          name: "Lux",
          max_adults: 4,
          max_children: 0,
        }),
      },
    )
    const roomCategoryData = await roomCategoryResponse.json()

    // 6. Create two rooms (as admin)
    const roomResponse1 = await fetch(
      `${orchestrator.webserverUrl}/api/v1/rooms`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          hotel_id: hotelId,
          room_type_id: roomTypeData.id,
          room_category_id: roomCategoryData.id,
          price_per_night: 1000.0,
          total_rooms: 10,
          name: "Quarto A",
        }),
      },
    )
    const roomData1 = await roomResponse1.json()
    roomId1 = roomData1.id

    const roomResponse2 = await fetch(
      `${orchestrator.webserverUrl}/api/v1/rooms`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          hotel_id: hotelId,
          room_type_id: roomTypeData.id,
          room_category_id: roomCategoryData.id,
          price_per_night: 1000.0,
          total_rooms: 10,
          name: "Quarto B",
        }),
      },
    )
    const roomData2 = await roomResponse2.json()
    roomId2 = roomData2.id
  })

  test("should swap Carla with Alessandra successfully, and Carla can register again", async () => {
    // 1. Create registration for Carla and Fernando (in Quarto A)
    const regResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/registrations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          room_id: roomId1,
          guests_data: [
            {
              name: "Carla Souza",
              badge_name: "CARLA",
              email: "carla@example.com",
              phone: "11988888888",
              gender: "Feminino",
              rg_number: "223334445",
              cpf_number: "222.333.444-55",
              birth_date: "1995-05-15",
            },
            {
              name: "Fernando Silva",
              badge_name: "FERNANDO",
              email: "fernando@example.com",
              phone: "11977777777",
              gender: "Masculino",
              rg_number: "334445556",
              cpf_number: "333.444.555-66",
              birth_date: "1994-04-14",
            },
          ],
        }),
      },
    )

    expect(regResponse.status).toBe(201)
    const regData = await regResponse.json()
    saleId = regData.saleId

    // Retrieve guest IDs from database or details endpoint
    const saleDetailsResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}`,
      {
        headers: { Cookie: `session_id=${adminToken}` },
      },
    )
    const saleDetails = await saleDetailsResponse.json()
    guestCarla = saleDetails.guests.find((g) => g.name === "Carla Souza")
    guestFernando = saleDetails.guests.find((g) => g.name === "Fernando Silva")

    expect(guestCarla).toBeDefined()
    expect(guestFernando).toBeDefined()

    // 2. Create Alessandra as a guest via api
    const guestAlessandraResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/guests`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          name: "Alessandra Lima",
          badge_name: "ALESSANDRA",
          email: "alessandra@example.com",
          phone: "11966666666",
          gender: "Feminino",
          rg_number: "445556667",
          cpf_number: "444.555.666-77",
          birth_date: "1993-03-13",
        }),
      },
    )
    expect(guestAlessandraResponse.status).toBe(201)
    guestAlessandra = await guestAlessandraResponse.json()

    // 3. Swap Carla with Alessandra
    const swapResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}/replace-guest`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          old_guest_id: guestCarla.id,
          new_guest_id: guestAlessandra.id,
        }),
      },
    )
    if (swapResponse.status !== 200) {
      console.log(
        "swapResponse FAIL:",
        swapResponse.status,
        await swapResponse.text(),
      )
    }
    expect(swapResponse.status).toBe(200)
    const swappedSale = await swapResponse.json()

    // Verify Alessandra is in, Carla is out
    const updatedGuests = swappedSale.guests
    expect(updatedGuests.some((g) => g.id === guestAlessandra.id)).toBe(true)
    expect(updatedGuests.some((g) => g.id === guestCarla.id)).toBe(false)
    expect(updatedGuests.some((g) => g.id === guestFernando.id)).toBe(true)

    // 4. Carla register again (in Quarto B)
    const secondRegResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/registrations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          room_id: roomId2,
          guests_data: [
            {
              name: "Carla Souza",
              badge_name: "CARLA",
              email: "carla@example.com",
              phone: "11988888888",
              gender: "Feminino",
              rg_number: "223334445",
              cpf_number: "222.333.444-55",
              birth_date: "1995-05-15",
            },
          ],
        }),
      },
    )

    expect(secondRegResponse.status).toBe(201)
    const secondRegData = await secondRegResponse.json()
    expect(secondRegData.saleId).toBeDefined()
  })

  test("should return 400 when trying to swap with a guest already active in the same hotel", async () => {
    // Alessandra is now in the first sale. Let's create a new sale with another guest.
    const tempGuestResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/guests`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          name: "Hugo Boss",
          badge_name: "HUGO",
          email: "hugo@example.com",
          phone: "11955555555",
          gender: "Masculino",
          rg_number: "556667778",
          cpf_number: "555.666.777-88",
          birth_date: "1992-02-12",
        }),
      },
    )
    const tempGuest = await tempGuestResponse.json()

    // Create a sale for Hugo Boss in Room B
    const hugoRegResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/registrations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          room_id: roomId2,
          guests_data: [
            {
              name: "Hugo Boss",
              badge_name: "HUGO",
              email: "hugo@example.com",
              phone: "11955555555",
              gender: "Masculino",
              rg_number: "556667778",
              cpf_number: "555.666.777-88",
              birth_date: "1992-02-12",
            },
          ],
        }),
      },
    )
    const hugoRegData = await hugoRegResponse.json()
    const hugoSaleId = hugoRegData.saleId

    // Try to replace Hugo Boss with Alessandra (who is already in saleId at the same hotel)
    const swapFailResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${hugoSaleId}/replace-guest`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          old_guest_id: tempGuest.id,
          new_guest_id: guestAlessandra.id,
        }),
      },
    )
    if (swapFailResponse.status !== 400) {
      console.log(
        "swapFailResponse (400 check) FAIL:",
        swapFailResponse.status,
        await swapFailResponse.text(),
      )
    }
    expect(swapFailResponse.status).toBe(400)
    const swapFailBody = await swapFailResponse.json()
    expect(swapFailBody.message).toContain(
      "já possui uma inscrição ativa para este hotel",
    )
  })

  test("should return 403 when trying to swap guest as non-admin regular user", async () => {
    const swapFailResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}/replace-guest`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${userToken}`,
        },
        body: JSON.stringify({
          old_guest_id: guestFernando.id,
          new_guest_id: guestAlessandra.id,
        }),
      },
    )
    expect(swapFailResponse.status).toBe(403)
  })

  test("should return 404 when trying to swap on a non-existent sale", async () => {
    const swapFailResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/99999999-9999-4999-9999-999999999999/replace-guest`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          old_guest_id: guestFernando.id,
          new_guest_id: guestAlessandra.id,
        }),
      },
    )
    if (swapFailResponse.status !== 404) {
      console.log(
        "swapFailResponse (404 check) FAIL:",
        swapFailResponse.status,
        await swapFailResponse.text(),
      )
    }
    expect(swapFailResponse.status).toBe(404)
  })

  test("should return 404 when trying to swap a guest not in the sale", async () => {
    // Hugo is not in saleId (which has Alessandra and Fernando)
    const nonExistentGuestResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/guests`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          name: "Random Guy",
          badge_name: "RANDOM",
          email: "random@example.com",
          phone: "11944444444",
          gender: "Masculino",
          rg_number: "667778889",
          cpf_number: "666.777.888-99",
          birth_date: "1991-01-11",
        }),
      },
    )
    const randomGuest = await nonExistentGuestResponse.json()

    const swapFailResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}/replace-guest`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          old_guest_id: randomGuest.id,
          new_guest_id: guestFernando.id,
        }),
      },
    )
    expect(swapFailResponse.status).toBe(404)
  })

  test("should return 400 when trying to swap guest on a cancelled sale", async () => {
    // 1. Cancel the sale
    const cancelResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}`,
      {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${adminToken}`,
        },
      },
    )
    expect(cancelResponse.status).toBe(204)

    // 2. Try to swap guest on the cancelled sale
    const swapFailResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}/replace-guest`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          old_guest_id: guestFernando.id,
          new_guest_id: guestCarla.id,
        }),
      },
    )
    expect(swapFailResponse.status).toBe(400)
    const swapFailBody = await swapFailResponse.json()
    expect(swapFailBody.message).toContain("Não é possível alterar hóspedes de uma inscrição cancelada")
  })
})

