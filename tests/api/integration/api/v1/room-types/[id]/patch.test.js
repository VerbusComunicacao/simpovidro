import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("PATCH /api/v1/room-types/[id]", () => {
  describe("Anonymous user", () => {
    test("Can't update room-type", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/room-types/780a77f5-6fca-4e95-bc6c-e93e889cba80",
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
        "http://localhost:3000/api/v1/room-types/780a77f5-6fca-4e95-bc6c-e93e889cba80",
        {
          method: "PATCH",
          body: JSON.stringify({
            name: "Updated Type",
            description: "Updated description",
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(403)
    })

    test("Room-type not found", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, ["update:content"])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch(
        "http://localhost:3000/api/v1/room-types/87562c5a-7f7b-4f9e-b4de-08552758e4e9",
        {
          method: "PATCH",
          body: JSON.stringify({
            name: "Updated Type",
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(404)
    })

    test("Update room-type with blank data", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, [
        "create:content",
        "update:content",
      ])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      // First create a room-type
      const created = await orchestrator.createRoomType(createdUser.id, {
        name: "Original Type",
        description: "D1",
      })

      // Try to update with blank data
      const response = await fetch(
        `http://localhost:3000/api/v1/room-types/${created.id}`,
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

    test("Update room-type successfully", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, [
        "create:content",
        "update:content",
      ])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const created = await orchestrator.createRoomType(createdUser.id, {
        name: "Original Type",
        description: "D1",
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/room-types/${created.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: "Updated Type",
            description: "D2",
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
        name: "Updated Type",
        description: "D2",
        user_id: createdUser.id,
        created_at: created.created_at.toISOString(),
        updated_at: expect.any(String),
      })
    })

    test("Update room-type with duplicate name", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, [
        "create:content",
        "update:content",
      ])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      // Create first room-type
      await orchestrator.createRoomType(createdUser.id, { name: "Type A" })

      // Create second room-type
      const typeB = await orchestrator.createRoomType(createdUser.id, {
        name: "Type B",
      })

      // Try to update Type B to have the same name as Type A
      const response = await fetch(
        `http://localhost:3000/api/v1/room-types/${typeB.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: "Type A",
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
          "Já existe um tipo de quarto cadastrado com esse nome para este usuário.",
        action: "Escolha outro nome ou edite o tipo de quarto existente.",
      })
    })

    test("Update room-type with same name (should work)", async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUser(createdUser.id)
      await orchestrator.setUserFeatures(createdUser.id, [
        "create:content",
        "update:content",
      ])

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const created = await orchestrator.createRoomType(createdUser.id, {
        name: "Type Original",
        description: "D1",
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/room-types/${created.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: "Type Original",
            description: "D2",
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      )

      expect(response.status).toBe(200)

      const updated = await response.json()
      expect(updated.name).toBe("Type Original")
      expect(updated.description).toBe("D2")
    })
  })
})
