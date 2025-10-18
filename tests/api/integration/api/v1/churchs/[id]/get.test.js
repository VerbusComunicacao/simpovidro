import orchestrator from "tests/orchestrator.js"
import { version as uuidVersion } from "uuid"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("GET /api/v1/churchs/[id]", () => {
  describe("Authenticated common user", () => {
    test("Retrieving church by id", async () => {
      const createdUser = await orchestrator.createUser()
      const sessionObject = await orchestrator.createSession(createdUser.id)

      await orchestrator.createChurch(sessionObject.user_id)
      const church = await orchestrator.createChurch(sessionObject.user_id)

      const response = await fetch(
        `http://localhost:3000/api/v1/churchs/${church.id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(200)

      const responseChurchBody = await response.json()

      expect(responseChurchBody).toEqual({
        id: church.id,
        name: church.name,
        user_id: church.user_id,
        created_at: church.created_at.toISOString(),
        updated_at: church.updated_at.toISOString(),
      })

      expect(uuidVersion(responseChurchBody.id)).toBe(4)
    })
  })
})
