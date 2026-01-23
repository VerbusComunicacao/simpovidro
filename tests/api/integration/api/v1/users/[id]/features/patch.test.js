import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("PATCH /api/v1/users/[id]/features", () => {
  describe("Anonymous user", () => {
    test("Should fail with 401", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/1ac34dd5-cca3-4ffa-88b2-73cd0fba852c/features",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            features: ["read:user"],
          }),
        },
      )

      expect(response.status).toBe(401)
    })
  })

  describe("Authenticated user without permission", () => {
    test("Should fail with 403 when updating another user", async () => {
      const userWithoutPermission = await orchestrator.createUser({
        email: "no-permission@test.com",
      })
      await orchestrator.activateUser(userWithoutPermission.id)
      const sessionObject = await orchestrator.createSession(
        userWithoutPermission.id,
      )

      const targetUser = await orchestrator.createUser({
        email: "target@test.com",
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${targetUser.id}/features`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            features: ["nuked"],
          }),
        },
      )

      expect(response.status).toBe(403)
      const responseBody = await response.json()
      expect(responseBody.name).toBe("ForbiddenError")
    })

    test("Should fail with 403 when updating self", async () => {
      const userWithoutPermission = await orchestrator.createUser({
        email: "self-update@test.com",
      })
      await orchestrator.activateUser(userWithoutPermission.id)
      const sessionObject = await orchestrator.createSession(
        userWithoutPermission.id,
      )

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${userWithoutPermission.id}/features`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            features: ["update:user:others"],
          }),
        },
      )

      expect(response.status).toBe(403)
    })
  })

  describe("Authenticated user with permission", () => {
    test("Should succeed when searching by email and updating features", async () => {
      const adminUser = await orchestrator.createUser({
        email: "admin-search@test.com",
      })
      await orchestrator.activateAdmUser(adminUser.id)

      const sessionObject = await orchestrator.createSession(adminUser.id)

      const targetUser = await orchestrator.createUser({
        email: "target-search@test.com",
      })

      // 1. Search by email
      const searchResponse = await fetch(
        `http://localhost:3000/api/v1/users?email=${targetUser.email}`,
        {
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )
      expect(searchResponse.status).toBe(200)
      const targetUserFound = await searchResponse.json()
      expect(targetUserFound.email).toBe(targetUser.email)

      // 2. Update features
      const newFeatures = ["read:user", "read:content"]
      const updateResponse = await fetch(
        `http://localhost:3000/api/v1/users/${targetUserFound.id}/features`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            features: newFeatures,
          }),
        },
      )

      expect(updateResponse.status).toBe(200)
      const responseBody = await updateResponse.json()
      expect(responseBody.features).toEqual(expect.arrayContaining(newFeatures))
      expect(responseBody.features.length).toBe(newFeatures.length)
    })
  })
})
