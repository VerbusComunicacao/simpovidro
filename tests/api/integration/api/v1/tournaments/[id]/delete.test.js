import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("DELETE /api/v1/tournaments/[id]", () => {
  describe("Anonymous user", () => {
    test("Should return 400 when unauthenticated", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/tournaments/00000000-0000-0000-0000-000000000000",
        {
          method: "DELETE",
        },
      )
      expect(response.status).toBe(400)
    })
  })

  describe("Authenticated user", () => {
    test("Should allow user to delete their own registration", async () => {
      const user = await orchestrator.createUser()
      await orchestrator.activateUser(user.id)
      const session = await orchestrator.createSession(user.id)

      // Create registration
      const createRes = await fetch("http://localhost:3000/api/v1/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({
          tournament: "volei",
          company_name: "Empresa Delete",
          participant_name: "Participante Delete",
          phone: "11999995555",
        }),
      })
      const created = await createRes.json()

      // Delete registration
      const deleteRes = await fetch(
        `http://localhost:3000/api/v1/tournaments/${created.id}`,
        {
          method: "DELETE",
          headers: {
            Cookie: `session_id=${session.token}`,
          },
        },
      )
      expect(deleteRes.status).toBe(200)

      // Verify list is now empty
      const listRes = await fetch("http://localhost:3000/api/v1/tournaments", {
        headers: {
          Cookie: `session_id=${session.token}`,
        },
      })
      const list = await listRes.json()
      expect(list.length).toBe(0)
    })

    test("Should forbid deleting registration of another user", async () => {
      // User 1
      const user1 = await orchestrator.createUser()
      await orchestrator.activateUser(user1.id)
      const session1 = await orchestrator.createSession(user1.id)

      // User 2
      const user2 = await orchestrator.createUser()
      await orchestrator.activateUser(user2.id)
      const session2 = await orchestrator.createSession(user2.id)

      // User 1 creates registration
      const createRes = await fetch("http://localhost:3000/api/v1/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session1.token}`,
        },
        body: JSON.stringify({
          tournament: "futebol",
          company_name: "Empresa User 1",
          participant_name: "Participante User 1",
          phone: "11999991111",
        }),
      })
      const created = await createRes.json()

      // User 2 tries to delete User 1's registration
      const deleteRes = await fetch(
        `http://localhost:3000/api/v1/tournaments/${created.id}`,
        {
          method: "DELETE",
          headers: {
            Cookie: `session_id=${session2.token}`,
          },
        },
      )
      expect(deleteRes.status).toBe(400)
      const body = await deleteRes.json()
      expect(body.message).toContain("não tem permissão")
    })
  })
})
