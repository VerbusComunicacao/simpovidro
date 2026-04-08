import activation from "models/activation.js"
import orchestrator from "tests/orchestrator.js"
import user from "models/user.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
  await orchestrator.deleteAllEmails()
})

describe("Use case: Registration flow (all successful)", () => {
  let createdAdminUserBody
  let adminActivationToken
  let createdUserBody
  let userActivationToken
  let userSession

  test("Create admin account", async () => {
    const createdAdminUserResponse = await fetch(
      "http://localhost:3000/api/v1/users",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: "RegistrationFlowAdmin",
          email: "registration.admin@flow.com",
          password: "abc123",
        }),
      },
    )
    expect(createdAdminUserResponse.status).toBe(201)
    createdAdminUserBody = await createdAdminUserResponse.json()
  })

  test("Receive activation email for admin", async () => {
    const lastEmail = await orchestrator.getLastEmail()
    const tokenMatch = lastEmail.text.match(/cadastro\/ativar\/([a-f0-9]+)/)
    expect(tokenMatch).toBeTruthy()
    adminActivationToken = tokenMatch[1]

    const activationTokenObject =
      await activation.findValidToken(adminActivationToken)
    expect(activationTokenObject.user_id).toBe(createdAdminUserBody.id)
  })

  test("Activate admin account", async () => {
    const activationResponse = await fetch(
      `http://localhost:3000/api/v1/activations/${adminActivationToken}`,
      { method: "PATCH" },
    )
    expect(activationResponse.status).toBe(200)
    const activationBody = await activationResponse.json()
    const activatedUser = await user.findOneById(activationBody.user_id)
    expect(activatedUser.features).toEqual([
      "create:session",
      "read:session",
      "create:guest",
      "read:guest",
      "update:guest",
      "update:guest:others",
      "delete:guest",
      "create:hotel",
      "read:hotel",
      "create:user",
      "read:user",
      "create:content",
      "read:content",
      "update:content",
      "update:user",
      "update:user:others",
      "delete:content",
      "delete:user",
      "delete:user:others",
      "read:user:others",
      "create:company",
      "read:company",
      "update:company",
      "delete:company",
    ])
  })

  test("Login as admin", async () => {
    const response = await fetch("http://localhost:3000/api/v1/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "registration.admin@flow.com",
        password: "abc123",
      }),
    })
    expect(response.status).toBe(201)
  })

  test("Create user account", async () => {
    const createdUserResponse = await fetch(
      "http://localhost:3000/api/v1/users",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: "RegistrationFlow",
          email: "registration@flow.com",
          password: "abc123",
        }),
      },
    )

    expect(createdUserResponse.status).toBe(201)
    createdUserBody = await createdUserResponse.json()

    expect(createdUserBody).toEqual({
      id: createdUserBody.id,
      full_name: "RegistrationFlow",
      email: "registration@flow.com",
      features: ["read:activation_token"],
      created_at: createdUserBody.created_at,
      updated_at: createdUserBody.updated_at,
    })
  })

  test("Failure to create session before activation", async () => {
    const response = await fetch("http://localhost:3000/api/v1/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "registration@flow.com",
        password: "abc123",
      }),
    })

    expect(response.status).toBe(403)
  })

  test("Receive activation email for user", async () => {
    const lastEmail = await orchestrator.getLastEmail()

    const tokenMatch = lastEmail.text.match(/cadastro\/ativar\/([a-f0-9]+)/)
    expect(tokenMatch).toBeTruthy()

    userActivationToken = tokenMatch[1]

    const activationTokenObject =
      await activation.findValidToken(userActivationToken)

    expect(activationTokenObject.user_id).toBe(createdUserBody.id)
    expect(activationTokenObject.used_at).toBe(null)

    expect(lastEmail.sender).toBe("<contato@abravidro.org.br>")
    expect(lastEmail.recipients[0]).toBe("<registration@flow.com>")
    expect(lastEmail.subject).toBe(`Ative seu cadastro!`)
    expect(lastEmail.text).toContain(`RegistrationFlow`)
  })

  test("Activate user account", async () => {
    const activationResponse = await fetch(
      `http://localhost:3000/api/v1/activations/${userActivationToken}`,
      {
        method: "PATCH",
      },
    )
    const activationBody = await activationResponse.json()
    expect(activationBody).toHaveProperty("user_id")
    expect(activationBody).toHaveProperty("used_at")

    expect(activationResponse.status).toBe(200)

    expect(Date.parse(activationBody.used_at)).not.toBeNaN()

    const activatedUser = await user.findOneById(activationBody.user_id)
    expect(activatedUser.features).toEqual([
      "create:session",
      "read:session",
      "create:guest",
      "read:guest",
      "read:user",
      "update:user",
    ])
  })

  test("Login as user", async () => {
    const response = await fetch("http://localhost:3000/api/v1/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "registration@flow.com",
        password: "abc123",
      }),
    })

    expect(response.status).toBe(201)
    userSession = await response.json()
  })

  test("Get user data", async () => {
    const response = await fetch("http://localhost:3000/api/v1/user", {
      headers: {
        Cookie: `session_id=${userSession.token}`,
      },
    })

    expect(response.status).toBe(200)
    const userBody = await response.json()

    expect(userBody).toEqual({
      id: createdUserBody.id,
      full_name: "RegistrationFlow",
      email: "registration@flow.com",
      features: [
        "create:session",
        "read:session",
        "create:guest",
        "read:guest",
        "read:user",
        "update:user",
      ],
      created_at: createdUserBody.created_at,
      updated_at: expect.any(String),
    })
  })
})
