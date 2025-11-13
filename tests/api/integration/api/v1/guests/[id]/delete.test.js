import orchestrator from "tests/orchestrator.js"
import guest from "models/guest.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("DELETE /api/v1/guests/[id]", () => {
  describe("Anonymous user", () => {
    test("Should delete a guest by ID", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["delete:guest"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const createdGuest = await guest.create(
        {
          name: "Guest to Delete",
          email: "deleteme@example.com",
          phone: "+5511999999907",
          gender: "Male",
          rg_number: "777777777",
          cpf_number: "777.777.777-07",
          birth_date: "1997-01-01",
        },
        createdUser.id,
      )

      const response = await fetch(
        `http://localhost:3000/api/v1/guests/${createdGuest.id}`,
        {
          method: "DELETE",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(204)

      const guestInDb = await guest
        .findOneById(createdGuest.id)
        .catch((error) => error)
      expect(guestInDb.name).toBe("NotFoundError")
    })

    test("Should return 404 if guest not found", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["delete:guest"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const nonExistentId = "87562c5a-7f7b-4f9e-b4de-08552758e4e9"
      const response = await fetch(
        `http://localhost:3000/api/v1/guests/${nonExistentId}`,
        {
          method: "DELETE",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )
      //expect(response.status).toBe(404)

      const responseBody = await response.json()
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O ID do hóspede informado não foi encontrado no sistema.",
        action: "Verifique se o ID está digitado corretamente.",
        status_code: 404,
      })
    })
  })
})
