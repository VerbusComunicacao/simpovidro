import orchestrator from "tests/orchestrator.js"
import guest from "models/guest.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("PATCH /api/v1/guests/[id]", () => {
  describe("Anonymous user", () => {
    test("Should update a guest by ID with valid data", async () => {
      const createdUser = await orchestrator.createUser({
        full_name: "Felipe",
      })
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["update:guest"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const createdGuest = await guest.create(
        {
          name: "Guest to Update",
          phone: "+5511999999904",
          gender: "Male",
          rg_number: "444444444",
          cpf_number: "444.444.444-04",
          birth_date: "1994-01-01",
        },
        createdUser.id,
      )

      const response = await fetch(
        `http://localhost:3000/api/v1/guests/${createdGuest.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            name: "Updated Guest Name",
          }),
        },
      )
      const responseBody = await response.json()

      expect(response.status).toBe(200)

      expect(responseBody.id).toBe(createdGuest.id)
      expect(responseBody.name).toBe("Updated Guest Name")
      expect(responseBody.id).toBe(createdGuest.id)
      expect(responseBody.name).toBe("Updated Guest Name")
    })

    test("Should return 404 if guest not found", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["update:guest"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const nonExistentId = "1ac34dd5-cca3-4ffa-88b2-73cd0fba852c"
      const response = await fetch(
        `http://localhost:3000/api/v1/guests/${nonExistentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            name: "Should not update",
          }),
        },
      )
      const responseBody = await response.json()

      expect(response.status).toBe(404)

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O ID do hóspede informado não foi encontrado no sistema.",
        action: "Verifique se o ID está digitado corretamente.",
        status_code: 404,
      })
    })

    test("Should return 409 if updating with duplicated unique field", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["update:guest"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      await guest.create(
        {
          name: "Existing Guest",
          phone: "+5511999999905",
          gender: "Female",
          rg_number: "555555555",
          cpf_number: "555.555.555-05",
          birth_date: "1995-01-01",
        },
        createdUser.id,
      )

      const guestToUpdate = await guest.create(
        {
          name: "Another Guest",
          phone: "+5511999999906",
          gender: "Male",
          rg_number: "666666666",
          cpf_number: "666.666.666-06",
          birth_date: "1996-01-01",
        },
        createdUser.id,
      )

      const response = await fetch(
        `http://localhost:3000/api/v1/guests/${guestToUpdate.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            rg_number: "555555555", // Duplicate RG
          }),
        },
      )
      expect(response.status).toBe(409)

      const responseBody = await response.json()
      expect(responseBody).toEqual({
        name: "ConflictError",
        message: "Já existe um hóspede cadastrado com este RG.",
        action: "Utilize um RG diferente.",
        status_code: 409,
      })
    })
  })
})
