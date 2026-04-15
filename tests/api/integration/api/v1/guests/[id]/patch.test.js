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
          badge_name: "Crachá Original",
          email: "original@example.com",
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
          badge_name: "Crachá Existente",
          email: "existing@example.com",
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
          badge_name: "Crachá Outro",
          email: "another@example.com",
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

  describe("Authenticated user", () => {
    test("Can't update other user's guest", async () => {
      // 1. Create User A (Owner)
      const userA = await orchestrator.createUser({ email: "userA@test.com" })
      await orchestrator.activateUser(userA.id)

      // 2. Create User B (Attacker)
      const userB = await orchestrator.createUser({ email: "userB@test.com" })
      await orchestrator.activateUser(userB.id)
      await orchestrator.setUserFeatures(userB.id, ["update:guest"])

      const sessionB = await orchestrator.createSession(userB.id)

      // 3. Create a guest belonging to User A
      const guestOfA = await guest.create(
        {
          name: "Guest of A",
          badge_name: "Crachá de A",
          email: "guest_a@example.com",
          phone: "+5511999999910",
          gender: "M",
          rg_number: "RG_A_10",
          cpf_number: "000.000.000-10",
          birth_date: "1980-01-01",
        },
        userA.id,
      )

      // 4. Try to update User A's guest as User B
      const response = await fetch(
        `http://localhost:3000/api/v1/guests/${guestOfA.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionB.token}`,
          },
          body: JSON.stringify({
            name: "Hacked Name",
          }),
        },
      )

      expect(response.status).toBe(403)
      const responseBody = await response.json()
      expect(responseBody.name).toBe("ForbiddenError")
    })

    test("With feature 'update:guest:others' should update other user's guest", async () => {
      // 1. Create User A (Owner)
      const userA = await orchestrator.createUser({
        email: "userA_others@test.com",
      })
      await orchestrator.activateUser(userA.id)

      // 2. Create User B (Admin)
      const userB = await orchestrator.createUser({
        email: "userB_admin@test.com",
      })
      await orchestrator.activateUser(userB.id)
      await orchestrator.setUserFeatures(userB.id, [
        "update:guest",
        "update:guest:others",
      ])

      const sessionB = await orchestrator.createSession(userB.id)

      // 3. Create a guest belonging to User A
      const guestOfA = await guest.create(
        {
          name: "Guest of A",
          badge_name: "Crachá de A Admin",
          email: "guest_a_admin@example.com",
          phone: "+5511999999911",
          gender: "F",
          rg_number: "RG_A_11",
          cpf_number: "000.000.000-11",
          birth_date: "1981-01-01",
        },
        userA.id,
      )

      // 4. Update User A's guest as User B (Admin)
      const response = await fetch(
        `http://localhost:3000/api/v1/guests/${guestOfA.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionB.token}`,
          },
          body: JSON.stringify({
            name: "Updated by Admin",
          }),
        },
      )

      expect(response.status).toBe(200)
      const responseBody = await response.json()
      expect(responseBody.name).toBe("Updated by Admin")
    })
  })
})
