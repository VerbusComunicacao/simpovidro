import database from "infra/database.js"
import orchestrator from "tests/orchestrator.js"
import guest from "models/guest.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
  await orchestrator.deleteAllEmails()
})

describe("PATCH /api/v1/activations/[token]", () => {
  test("Should sync guest user_id upon account activation", async () => {
    const targetEmail = "sync.me@example.com"

    // 1. Create a guest directly in the database without a user_id
    await database.query({
      text: `
        INSERT INTO guests (
          name, email, phone, gender, rg_number, cpf_number, birth_date
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7
        )`,
      values: [
        "Guest to be synced",
        targetEmail,
        "(11) 99999-9999",
        "O",
        "SYNC123",
        "123.123.123-12",
        "1990-01-01",
      ],
    })

    // Verify guest is there without user_id
    const guestBefore = await guest.findOneByCpfOrRg(
      "123.123.123-12",
      "SYNC123",
    )

    expect(guestBefore.user_id).toBeNull()

    // 2. Create a user with the same email
    const createdUserResponse = await fetch(
      "http://localhost:3000/api/v1/users",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: "Sync User",
          email: targetEmail,
          password: "password123",
        }),
      },
    )
    expect(createdUserResponse.status).toBe(201)
    const createdUserBody = await createdUserResponse.json()

    // 3. Get activation token from email
    const lastEmail = await orchestrator.getLastEmail()
    const tokenMatch = lastEmail.text.match(/cadastro\/ativar\/([a-f0-9]+)/)
    expect(tokenMatch).toBeTruthy()

    const activationToken = tokenMatch[1]

    // 4. Activate the account
    const activationResponse = await fetch(
      `http://localhost:3000/api/v1/activations/${activationToken}`,
      { method: "PATCH" },
    )
    const responseBody = await activationResponse.json()
    console.log("Activation response:", responseBody)
    expect(activationResponse.status).toBe(200)

    // 5. Verify the guest is now synced
    const guestAfter = await guest.findOneByCpfOrRg("123.123.123-12", "SYNC123")
    console.log("Guest after activation:", guestAfter.id, guestAfter.user_id)
    expect(guestAfter.user_id).toBe(createdUserBody.id)
  })
})
