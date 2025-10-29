import activation from "models/activation.js"
import orchestrator from "tests/orchestrator.js"
import user from "models/user.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
  await orchestrator.deleteAllEmails()
})

let createdUserBody

describe("Use case: Registration flow (all successful)", () => {
  let createdUserResponse
  let activationToken

  test("Create user account", async () => {
    createdUserResponse = await fetch("http://localhost:3000/api/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "RegistrationFlow",
        email: "registration@flow.com",
        password: "abc123",
      }),
    })

    createdUserBody = await createdUserResponse.json()

    expect(createdUserBody).toEqual({
      id: createdUserBody.id,
      username: "RegistrationFlow",
      email: "registration@flow.com",
      features: ["read:activation_token"],
      password: createdUserBody.password,
      created_at: createdUserBody.created_at,
      updated_at: createdUserBody.updated_at,
    })
  })

  test("Failuer create session", async () => {
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

  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail()

    const tokenMatch = lastEmail.text.match(/ativar\/([a-f0-9]+)/)
    expect(tokenMatch).toBeTruthy()

    activationToken = tokenMatch[1]

    const activationTokenObject =
      await activation.findValidToken(activationToken)

    expect(activationTokenObject.user_id).toBe(createdUserBody.id)
    expect(activationTokenObject.used_at).toBe(null)

    expect(lastEmail.sender).toBe("<contato@peregrinos.com.br>")
    expect(lastEmail.recipients[0]).toBe("<registration@flow.com>")
    expect(lastEmail.subject).toBe(`Ative seu cadastro!`)
    expect(lastEmail.text).toContain(`RegistrationFlow`)
  })

  test("Activate account", async () => {
    // Fazer a requisição de ativação
    const activationResponse = await fetch(
      `http://localhost:3000/api/v1/activations/${activationToken}`,
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
    expect(activatedUser.features).toEqual(["create:session"])
  })

  test("Login", async () => {
    const response = await fetch("http://localhost:3000/api/v1/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "registration@flow.com",
        password: "abc123",
      }),
    })

    expect(response.status).toBe(201)
  })

  test("Get user information", async () => {})
})
