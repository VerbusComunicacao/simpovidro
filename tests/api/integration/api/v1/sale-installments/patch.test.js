import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.runPendingMigrations()
})

describe("PATCH /api/v1/sale-installments/[id]", () => {
  let userToken
  let installmentId

  beforeAll(async () => {
    const adminUser = await orchestrator.createUser({
      email: "admin-patch-inst@example.com",
      password: "password123",
    })
    await orchestrator.activateAdmUser(adminUser.id)
    await orchestrator.createSession(adminUser.id)
    // admToken removed as it's not needed for registration

    const regularUser = await orchestrator.createUser({
      email: "user-patch-inst@example.com",
      password: "password123",
    })
    await orchestrator.activateUser(regularUser.id)
    await orchestrator.setUserFeatures(regularUser.id, [
      "read:content",
      "update:content",
      "create:session",
    ])
    const regularSession = await orchestrator.createSession(regularUser.id)
    userToken = regularSession.token

    // Setup a sale and get an installment ID
    // 1. Create Room (orchestrator handles hotel, room type, and category)
    const roomObj = await orchestrator.createRoom(adminUser.id, {
      price_per_night: 500,
      total_rooms: 10,
    })
    const roomId = roomObj.id

    // 2. Create Sale
    await orchestrator.createRegistration(regularUser.id, { room_id: roomId })

    // 3. Get an installment ID
    const instResp = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sale-installments`,
      {
        headers: { Cookie: `session_id=${userToken}` },
      },
    )
    const installments = await instResp.json()
    installmentId = installments[0].id
  })

  test("should update installment status and paid_amount", async () => {
    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sale-installments/${installmentId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${userToken}`,
        },
        body: JSON.stringify({
          status: "paid",
          paid_amount: 500.0,
          payment_date: new Date().toISOString(),
          notes: "Paid via bank transfer",
        }),
      },
    )

    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.status).toBe("paid")
    expect(Number(data.paid_amount)).toBe(500.0)
    expect(data.notes).toBe("Paid via bank transfer")
  })

  test("should return 403 if user lacks update:content permission", async () => {
    const weakUser = await orchestrator.createUser({
      email: "weak-user@ex.com",
      password: "password123",
    })
    await orchestrator.activateUser(weakUser.id)
    await orchestrator.setUserFeatures(weakUser.id, ["read:content"])
    const weakSession = await orchestrator.createSession(weakUser.id)
    const weakToken = weakSession.token

    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/sale-installments/${installmentId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${weakToken}`,
        },
        body: JSON.stringify({ status: "paid" }),
      },
    )

    expect(response.status).toBe(403)
  })
})
