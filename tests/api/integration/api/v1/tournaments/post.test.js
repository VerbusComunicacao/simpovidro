import { version as uuidVersion } from "uuid"
import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("POST /api/v1/tournaments", () => {
  describe("Anonymous user", () => {
    test("Should return 400 when unauthenticated", async () => {
      const response = await fetch("http://localhost:3000/api/v1/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tournament: "futebol",
          company_name: "Empresa Vidros",
          participant_name: "Carlos Silva",
          phone: "11999998888",
        }),
      })

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.message).toContain("Você precisa estar logado")
    })
  })

  describe("Authenticated user", () => {
    test("Should register a single participant successfully", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      const session = await orchestrator.createSession(createdUser.id)

      const response = await fetch("http://localhost:3000/api/v1/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({
          tournament: "futebol",
          company_name: "Vidraçaria Alvorada",
          participant_name: "João da Silva",
          phone: "(11) 98888-7777",
        }),
      })

      expect(response.status).toBe(201)
      const body = await response.json()

      expect(uuidVersion(body.id)).toBe(4)
      expect(body.user_id).toBe(createdUser.id)
      expect(body.tournament).toBe("futebol")
      expect(body.company_name).toBe("Vidraçaria Alvorada")
      expect(body.participant_name).toBe("João da Silva")
      expect(body.phone).toBe("(11) 98888-7777")
      expect(body.created_at).toBeDefined()
    })

    test("Should register multiple participants in batch successfully", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      const session = await orchestrator.createSession(createdUser.id)

      const response = await fetch("http://localhost:3000/api/v1/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({
          participants: [
            {
              tournament: "volei",
              company_name: "Cristais do Sul",
              participant_name: "Mariana Souza",
              phone: "21988881111",
            },
            {
              tournament: "tenis",
              company_name: "Cristais do Sul",
              participant_name: "Pedro Santos",
              phone: "21988882222",
            },
          ],
        }),
      })

      expect(response.status).toBe(201)
      const body = await response.json()

      expect(Array.isArray(body)).toBe(true)
      expect(body.length).toBe(2)
      expect(body[0].tournament).toBe("volei")
      expect(body[0].participant_name).toBe("Mariana Souza")
      expect(body[1].tournament).toBe("tenis")
      expect(body[1].participant_name).toBe("Pedro Santos")
    })

    test("Should return 400 when tournament is invalid", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      const session = await orchestrator.createSession(createdUser.id)

      const response = await fetch("http://localhost:3000/api/v1/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({
          tournament: "basquete",
          company_name: "Empresa Invalida",
          participant_name: "Atleta Invalido",
          phone: "11999998888",
        }),
      })

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.message).toContain("inválido")
    })

    test("Should return 400 when required fields are missing", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      const session = await orchestrator.createSession(createdUser.id)

      const response = await fetch("http://localhost:3000/api/v1/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({
          tournament: "futebol",
          company_name: "",
          participant_name: "Sem Empresa",
          phone: "11999998888",
        }),
      })

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.message).toContain("empresa")
    })
  })
})
