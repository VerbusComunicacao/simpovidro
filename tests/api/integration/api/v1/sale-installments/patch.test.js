import orchestrator from "tests/orchestrator.js"
import database from "infra/database.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("PATCH /api/v1/sale-installments/[id]", () => {
  test("should update installment status and auto-update sale status when all paid", async () => {
    // 1. Setup
    const adminUser = await orchestrator.createUser({
      email: "admin-installments@example.com",
      password: "password123",
    })
    await orchestrator.activateAdmUser(adminUser.id)
    await orchestrator.addFeatureToUser(adminUser, ["update:content"])
    const adminSession = await orchestrator.createSession(adminUser.id)
    const token = adminSession.token

    const hotel = await orchestrator.createHotel(adminUser.id, {
      check_in_date: new Date(
        Date.now() + 1000 * 60 * 60 * 24 * 90,
      ).toISOString(),
      check_out_date: new Date(
        Date.now() + 1000 * 60 * 60 * 24 * 95,
      ).toISOString(),
    })
    const roomType = await orchestrator.createRoomType(adminUser.id)
    const roomCategory = await orchestrator.createRoomCategory(adminUser.id)
    const room = await orchestrator.createRoom(adminUser.id, {
      hotel_id: hotel.id,
      room_type_id: roomType.id,
      room_category_id: roomCategory.id,
    })

    const guestUser = await orchestrator.createUser()
    await orchestrator.activateUser(guestUser.id)

    const registration = await orchestrator.createRegistration(guestUser.id, {
      room_id: room.id,
      payment_method: "installments",
    })

    const saleResult = await database.query({
      text: `SELECT id FROM sales WHERE room_id = $1`,
      values: [room.id],
    })
    const saleId = saleResult.rows[0].id

    const installmentsResult = await database.query({
      text: `SELECT * FROM sale_installments WHERE sale_id = $1 ORDER BY installment_number`,
      values: [saleId],
    })
    const installments = installmentsResult.rows

    expect(installments.length).toBeGreaterThanOrEqual(2)

    // 2. Pay First Installment
    const response1 = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sale-installments/${installments[0].id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${token}`,
        },
        body: JSON.stringify({ status: "paid" }),
      },
    )

    // If this fails, the API crashed.
    expect(response1.status).toBe(200)

    let saleCheck = await database.query({
      text: `SELECT status, payment_status FROM sales WHERE id = $1`,
      values: [saleId],
    })
    expect(saleCheck.rows[0].payment_status).toBe("partial")

    // 3. Pay Rest
    for (let i = 1; i < installments.length; i++) {
      const responseInLoop = await fetch(
        `${orchestrator.webserverUrl}/api/v1/sale-installments/${installments[i].id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${token}`,
          },
          body: JSON.stringify({ status: "paid" }),
        },
      )
      expect(responseInLoop.status).toBe(200)
    }

    saleCheck = await database.query({
      text: `SELECT status, payment_status FROM sales WHERE id = $1`,
      values: [saleId],
    })

    expect(saleCheck.rows[0].status).toBe("confirmed")
    expect(saleCheck.rows[0].payment_status).toBe("paid")
  })
})
