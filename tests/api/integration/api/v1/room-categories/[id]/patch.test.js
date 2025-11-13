import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("PATCH /api/v1/room-categories/[id]", () => {
  describe("Anonymous user", () => {
    test("Can't update room-category", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/room-categories/780a77f5-6fca-4e95-bc6c-e93e889cba80",
        {
          method: "PATCH",
        },
      )
      expect(response.status).toBe(401)
    })
  })

  describe("Authenticated user", () => {
    test("Without feature 'update:content'", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithoutUpdateFeature",
      })

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch(
        "http://localhost:3000/api/v1/room-categories/780a77f5-6fca-4e95-bc6c-e93e889cba80",
        {
          method: "PATCH",
          body: JSON.stringify({
            name: "Updated Category",
            max_adults: 3,
            max_children: 2,
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(403)
    })

    test("Room-category not found", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["update:content"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch(
        "http://localhost:3000/api/v1/room-categories/87562c5a-7f7b-4f9e-b4de-08552758e4e9",
        {
          method: "PATCH",
          body: JSON.stringify({
            name: "Updated Category",
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(404)
    })

    test("Update room-category with blank data", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, [
        "create:content",
        "update:content",
      ])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const created = await orchestrator.createRoomCategory(createdUser.id, {
        name: "Original Category",
        max_adults: 2,
        max_children: 1,
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/room-categories/${created.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(400)

      const errorBody = await response.json()
      expect(errorBody).toEqual({
        action: "Envie algum campo e tente novamente.",
        message: `Nenhum campo enviado para atualização.`,
        name: "ValidationError",
        status_code: 400,
      })
    })

    test("Update room-category successfully", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, [
        "create:content",
        "update:content",
      ])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const created = await orchestrator.createRoomCategory(createdUser.id, {
        name: "Original Category",
        max_adults: 2,
        max_children: 1,
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/room-categories/${created.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: "Updated Category",
            max_adults: 4,
            max_children: 3,
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(200)

      const updated = await response.json()
      expect(updated).toEqual({
        id: created.id,
        name: "Updated Category",
        max_adults: 4,
        max_children: 3,
        user_id: createdUser.id,
        created_at: created.created_at.toISOString(),
        updated_at: expect.any(String),
      })
    })

    test("Update room-category with duplicate name", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, [
        "create:content",
        "update:content",
      ])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      await orchestrator.createRoomCategory(createdUser.id, {
        name: "Category A",
      })

      const categoryB = await orchestrator.createRoomCategory(createdUser.id, {
        name: "Category B",
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/room-categories/${categoryB.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: "Category A",
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(409)

      const errorBody = await response.json()
      expect(errorBody).toEqual({
        name: "ConflictError",
        status_code: 409,
        message:
          "Já existe uma categoria de quarto cadastrada com esse nome para este usuário.",
        action: "Escolha outro nome ou edite a categoria de quarto existente.",
      })
    })

    test("Update room-category with same name (should work)", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["update:content"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const created = await orchestrator.createRoomCategory(createdUser.id, {
        name: "Category Original",
        max_adults: 2,
        max_children: 1,
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/room-categories/${created.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: "Category Original",
            max_adults: 3,
            max_children: 2,
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(200)

      const updated = await response.json()
      expect(updated.name).toBe("Category Original")
      expect(updated.max_adults).toBe(3)
      expect(updated.max_children).toBe(2)
    })
  })
})
