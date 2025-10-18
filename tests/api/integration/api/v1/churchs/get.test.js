import orchestrator from "tests/orchestrator.js"
import { version as uuidVersion } from "uuid"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("GET /api/v1/churchs", () => {
  describe("Authenticated common user", () => {
    test("Retrieving 2 churchs in list", async () => {
      const createdUser = await orchestrator.createUser()
      const sessionObject = await orchestrator.createSession(createdUser.id)

      await orchestrator.createChurch(sessionObject.user_id)
      const church = await orchestrator.createChurch(sessionObject.user_id)

      const response = await fetch(`http://localhost:3000/api/v1/churchs`, {
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
      })

      expect(response.status).toBe(201)

      const responseChurchBody = await response.json()

      expect(responseChurchBody.length).toBe(2)

      expect(responseChurchBody[0]).toEqual({
        id: church.id,
        name: church.name,
        user_id: church.user_id,
        created_at: church.created_at.toISOString(),
        updated_at: church.updated_at.toISOString(),
      })

      expect(uuidVersion(responseChurchBody[0].id)).toBe(4)
      expect(
        responseChurchBody[0].created_at > responseChurchBody[1].created_at,
      ).toBe(true)
    })

    test("Retrieving 15 churchs with pagination", async () => {
      const createdUser = await orchestrator.createUser()
      const sessionObject = await orchestrator.createSession(createdUser.id)

      await orchestrator.createManyChurches(sessionObject.user_id, 14)
      const church = await orchestrator.createChurch(sessionObject.user_id)

      const response = await fetch(`http://localhost:3000/api/v1/churchs`, {
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
      })

      expect(response.status).toBe(201)

      const responseChurchBody = await response.json()

      expect(responseChurchBody.length).toBe(10)

      expect(responseChurchBody[0]).toEqual({
        id: church.id,
        name: church.name,
        user_id: church.user_id,
        created_at: church.created_at.toISOString(),
        updated_at: church.updated_at.toISOString(),
      })

      expect(uuidVersion(responseChurchBody[0].id)).toBe(4)
      expect(
        responseChurchBody[0].created_at > responseChurchBody[1].created_at,
      ).toBe(true)

      const response2 = await fetch(
        `http://localhost:3000/api/v1/churchs?page=2`,
        {
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      const responseBody2 = await response2.json()

      expect(responseBody2.length).toBe(5)
    })
  })
})
