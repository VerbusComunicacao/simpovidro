import database from "infra/database"
import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("DELETE /api/v1/companies/[id]", () => {
  describe("Anonymous user", () => {
    test("Can't delete company", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/companies/87562c5a-7f7b-4f9e-b4de-08552758e4e9",
        {
          method: "DELETE",
        },
      )
      expect(response.status).toBe(401)
    })
  })

  describe("Authenticated user", () => {
    test("Regular user (activated) can't delete company", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch(
        `http://localhost:3000/api/v1/companies/87562c5a-7f7b-4f9e-b4de-08552758e4e9`,
        {
          method: "DELETE",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(403)
    })

    test("Authenticated user without feature 'delete:company' can't delete company", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithoutDeleteFeature",
      })

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch(
        `http://localhost:3000/api/v1/companies/87562c5a-7f7b-4f9e-b4de-08552758e4e9`,
        {
          method: "DELETE",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(403)
    })

    test("Successfully delete a company", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateAdmUser(createdUser.id)

      const sessionObject = await orchestrator.createSession(createdUser.id)

      // Create a company to delete
      const companyData = {
        corporate_name: "Empresa Para Deletar",
        badge: "Deletar",
        cnpj: "22.222.222/2222-22",
        address: "Rua Y",
        address_number: "456",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
        phone: "98765432",
        email: "delete@empresa.com",
        responsible_person: "Admin",
        zip_code: "01234-567",
      }

      const postResponse = await fetch(
        "http://localhost:3000/api/v1/companies",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify(companyData),
        },
      )

      const companyCreated = await postResponse.json()
      expect(postResponse.status).toBe(201)

      // Delete the company
      const deleteResponse = await fetch(
        `http://localhost:3000/api/v1/companies/${companyCreated.id}`,
        {
          method: "DELETE",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(deleteResponse.status).toBe(204)

      // Verify it was deleted
      const results = await database.query({
        text: `SELECT * FROM companies WHERE id = $1`,
        values: [companyCreated.id],
      })

      expect(results.rowCount).toBe(0)
    })

    test("Return 404 for non-existent company", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateAdmUser(createdUser.id)

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch(
        "http://localhost:3000/api/v1/companies/87562c5a-7f7b-4f9e-b4de-08552758e4e9",
        {
          method: "DELETE",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(404)
    })
  })
})
