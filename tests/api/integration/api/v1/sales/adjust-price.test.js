import orchestrator from "tests/orchestrator.js"
import database from "infra/database.js"
import { faker } from "@faker-js/faker"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("PATCH /api/v1/sales/[id]/adjust-price", () => {
  let adminToken
  let regularUserToken
  let roomId
  let saleId

  function generateCpf() {
    const randomDigits = () => Math.floor(100 + Math.random() * 900).toString()
    const d1 = randomDigits()
    const d2 = randomDigits()
    const d3 = randomDigits()
    const d4 = Math.floor(10 + Math.random() * 90).toString()
    return `${d1}.${d2}.${d3}-${d4}`
  }

  async function createTestRegistration() {
    const cpf1 = generateCpf()
    const cpf2 = generateCpf()

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
          payment_method: "cash",
          guests_data: [
            {
              name: faker.person.fullName(),
              badge_name: faker.person.firstName().toUpperCase(),
              email: faker.internet.email().toLowerCase(),
              phone: "11988888881",
              gender: "Feminino",
              rg_number: faker.string.numeric(9),
              cpf_number: cpf1,
              birth_date: "1995-05-15",
            },
            {
              name: faker.person.fullName(),
              badge_name: faker.person.firstName().toUpperCase(),
              email: faker.internet.email().toLowerCase(),
              phone: "11977777771",
              gender: "Masculino",
              rg_number: faker.string.numeric(9),
              cpf_number: cpf2,
              birth_date: "1994-04-14",
            },
          ],
        }),
      },
    )

    if (regResponse.status !== 201) {
      const err = await regResponse.text()
      throw new Error(
        `Failed to create registration: ${regResponse.status} - ${err}`,
      )
    }

    const regData = await regResponse.json()
    return regData.saleId
  }

  beforeAll(async () => {
    // 1. Setup Admin User
    const adminUser = await orchestrator.createUser({
      full_name: "Admin User",
      email: "admin-adjust-price@example.com",
      password: "password123",
    })
    await orchestrator.activateAdmUser(adminUser.id)
    const adminSession = await orchestrator.createSession(adminUser.id)
    adminToken = adminSession.token

    // 2. Setup Regular User (without update:content)
    const regularUser = await orchestrator.createUser({
      full_name: "Regular User",
      email: "user-adjust-price@example.com",
      password: "password123",
    })
    await orchestrator.activateUser(regularUser.id)
    await orchestrator.setUserFeatures(regularUser.id, [
      "create:session",
      "read:session",
      "read:content",
    ])
    const regularSession = await orchestrator.createSession(regularUser.id)
    regularUserToken = regularSession.token

    // 3. Create Hotel & Room
    const hotel = await orchestrator.createHotel(adminUser.id, {
      check_in_date: "2026-11-01",
      check_out_date: "2026-11-05",
    })
    const roomType = await orchestrator.createRoomType(adminUser.id)
    const roomCategory = await orchestrator.createRoomCategory(adminUser.id, {
      max_adults: 2,
      max_children: 0,
    })

    const room = await orchestrator.createRoom(adminUser.id, {
      hotel_id: hotel.id,
      room_type_id: roomType.id,
      room_category_id: roomCategory.id,
      available_rooms: 50,
      price_per_night: 1500,
      name: "Room Deluxe",
    })
    roomId = room.id
  })

  beforeEach(async () => {
    saleId = await createTestRegistration()
  })

  test("should adjust registration price with valid discount calculation", async () => {
    // 1. Check initial sale details
    const initialSaleRes = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}`,
      {
        headers: { Cookie: `session_id=${adminToken}` },
      },
    )
    const initialSale = await initialSaleRes.json()
    const originalTotal = Number(initialSale.total_amount)
    expect(originalTotal).toBe(3000)
    expect(Number(initialSale.final_amount)).toBe(3000)
    expect(Number(initialSale.discount_amount)).toBe(0)

    // 2. Adjust price to 2500
    const adjustRes = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}/adjust-price`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          new_value: 2500,
          send_email: false,
        }),
      },
    )

    expect(adjustRes.status).toBe(200)
    const updatedSale = await adjustRes.json()

    // Gross amount must remain 3000
    expect(Number(updatedSale.total_amount)).toBe(3000)
    // Discount amount must be 500
    expect(Number(updatedSale.discount_amount)).toBe(500)
    // Final amount must be 2500
    expect(Number(updatedSale.final_amount)).toBe(2500)
    // Discount percentage should be 16.67%
    expect(Number(updatedSale.discount_percentage)).toBeCloseTo(16.67, 1)

    // Verify installment in database
    const installmentsRes = await database.query({
      text: `SELECT * FROM sale_installments WHERE sale_id = $1`,
      values: [saleId],
    })
    expect(installmentsRes.rowCount).toBe(1)
    expect(Number(installmentsRes.rows[0].amount)).toBe(2500)
  })

  test("should adjust price to 0 (100% discount / cortesia)", async () => {
    const adjustRes = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}/adjust-price`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          new_value: 0,
          send_email: false,
        }),
      },
    )

    expect(adjustRes.status).toBe(200)
    const updatedSale = await adjustRes.json()

    expect(Number(updatedSale.total_amount)).toBe(3000)
    expect(Number(updatedSale.discount_amount)).toBe(3000)
    expect(Number(updatedSale.discount_percentage)).toBe(100)
    expect(Number(updatedSale.final_amount)).toBe(0)
    expect(updatedSale.status).toBe("confirmed")
    expect(updatedSale.payment_status).toBe("paid")

    // Pending installments should be deleted
    const installmentsRes = await database.query({
      text: `SELECT * FROM sale_installments WHERE sale_id = $1`,
      values: [saleId],
    })
    expect(installmentsRes.rowCount).toBe(0)
  })

  test("should allow adjusting price and sending alteration email", async () => {
    const adjustRes = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}/adjust-price`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          new_value: 2000,
          send_email: true,
        }),
      },
    )

    expect(adjustRes.status).toBe(200)
    const updatedSale = await adjustRes.json()
    expect(Number(updatedSale.final_amount)).toBe(2000)
    expect(Number(updatedSale.discount_amount)).toBe(1000)
  })

  test("should deny access for unauthenticated user", async () => {
    const res = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}/adjust-price`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          new_value: 2000,
        }),
      },
    )

    expect(res.status).toBe(401)
  })

  test("should deny access for user without update:content feature", async () => {
    const res = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}/adjust-price`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${regularUserToken}`,
        },
        body: JSON.stringify({
          new_value: 2000,
        }),
      },
    )

    expect(res.status).toBe(403)
  })

  test("should return 404 for non-existent sale ID", async () => {
    const fakeId = faker.string.uuid()
    const res = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${fakeId}/adjust-price`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          new_value: 2000,
        }),
      },
    )

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.name).toBe("NotFoundError")
  })

  test("should return 400 when new_value is negative", async () => {
    const res = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}/adjust-price`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          new_value: -100,
        }),
      },
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.name).toBe("ValidationError")
  })

  test("should return 400 when new_value is greater than total_amount", async () => {
    const res = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}/adjust-price`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          new_value: 5000,
        }),
      },
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.name).toBe("ValidationError")
    expect(body.message).toContain(
      "não pode ser maior que o valor bruto original",
    )
  })

  test("should return 400 when new_value is missing or invalid", async () => {
    const res = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}/adjust-price`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          new_value: "invalid-number",
        }),
      },
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.name).toBe("ValidationError")
  })

  test("should return 400 when attempting to adjust a cancelled sale", async () => {
    // 1. Cancel the sale
    await fetch(`${orchestrator.webserverUrl}/api/v1/sales/${saleId}`, {
      method: "DELETE",
      headers: { Cookie: `session_id=${adminToken}` },
    })

    // 2. Attempt to adjust price
    const res = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sales/${saleId}/adjust-price`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminToken}`,
        },
        body: JSON.stringify({
          new_value: 1000,
        }),
      },
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.name).toBe("ValidationError")
    expect(body.message).toContain("cancelada")
  })
})
