import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("GET /api/v1/tournaments", () => {
  describe("Anonymous user", () => {
    test("Should return 400 when unauthenticated", async () => {
      const response = await fetch("http://localhost:3000/api/v1/tournaments")
      expect(response.status).toBe(400)
    })
  })

  describe("Authenticated user", () => {
    test("Should return only user's own tournament registrations", async () => {
      // User 1
      const user1 = await orchestrator.createUser()
      await orchestrator.activateUser(user1.id)
      const session1 = await orchestrator.createSession(user1.id)

      // User 2
      const user2 = await orchestrator.createUser()
      await orchestrator.activateUser(user2.id)
      const session2 = await orchestrator.createSession(user2.id)

      // User 1 registers for Futebol
      await fetch("http://localhost:3000/api/v1/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session1.token}`,
        },
        body: JSON.stringify({
          tournament: "futebol",
          company_name: "Empresa 1",
          participant_name: "Participante 1",
          phone: "11999990001",
        }),
      })

      // User 2 registers for Tenis
      await fetch("http://localhost:3000/api/v1/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session2.token}`,
        },
        body: JSON.stringify({
          tournament: "tenis",
          company_name: "Empresa 2",
          participant_name: "Participante 2",
          phone: "11999990002",
        }),
      })

      // User 1 requests list
      const res1 = await fetch("http://localhost:3000/api/v1/tournaments", {
        headers: {
          Cookie: `session_id=${session1.token}`,
        },
      })
      expect(res1.status).toBe(200)
      const list1 = await res1.json()
      expect(list1.length).toBe(1)
      expect(list1[0].participant_name).toBe("Participante 1")
      expect(list1[0].tournament).toBe("futebol")

      // User 2 requests list
      const res2 = await fetch("http://localhost:3000/api/v1/tournaments", {
        headers: {
          Cookie: `session_id=${session2.token}`,
        },
      })
      expect(res2.status).toBe(200)
      const list2 = await res2.json()
      expect(list2.length).toBe(1)
      expect(list2[0].participant_name).toBe("Participante 2")
      expect(list2[0].tournament).toBe("tenis")
    })
  })

  describe("GET /api/v1/tournaments/defaults", () => {
    test("Should return 400 when unauthenticated", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/tournaments/defaults",
      )
      expect(response.status).toBe(400)
    })

    test("Should return defaults based on user, previous registration or guest data", async () => {
      const user = await orchestrator.createUser({
        full_name: "Default Test User",
        email: "default-user@example.com",
      })
      await orchestrator.activateUser(user.id)
      const session = await orchestrator.createSession(user.id)

      // First check with only user created
      const initialRes = await fetch(
        "http://localhost:3000/api/v1/tournaments/defaults",
        {
          headers: {
            Cookie: `session_id=${session.token}`,
          },
        },
      )
      expect(initialRes.status).toBe(200)
      const initialData = await initialRes.json()
      expect(initialData.participant_name).toBe("Default Test User")

      // Register tournament with company and phone
      await fetch("http://localhost:3000/api/v1/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({
          tournament: "futebol",
          company_name: "Empresa Defaults Ltd",
          participant_name: "Default Test User",
          phone: "(11) 97777-6666",
        }),
      })

      // Next defaults call should return the company and phone from previous registration
      const updatedRes = await fetch(
        "http://localhost:3000/api/v1/tournaments/defaults",
        {
          headers: {
            Cookie: `session_id=${session.token}`,
          },
        },
      )
      expect(updatedRes.status).toBe(200)
      const updatedData = await updatedRes.json()
      expect(updatedData.company_name).toBe("Empresa Defaults Ltd")
      expect(updatedData.phone).toBe("(11) 97777-6666")
    })
  })
})
