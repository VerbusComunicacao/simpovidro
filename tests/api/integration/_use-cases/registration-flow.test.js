import activation from "models/activation.js"
import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
  await orchestrator.deleteAllEmails()
})

let createdUserBody

describe("Use case: Registration flow (all successful)", () => {
  test("Create user account", async () => {
    const createdUserResponse = await fetch(
      "http://localhost:3000/api/v1/users",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "RegistrationFlow",
          email: "registration@flow.com",
          password: "abc123",
        }),
      },
    )

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

    const activationToken = await activation.findOneByUserId(createdUserBody.id)

    expect(lastEmail.sender).toBe("<contato@peregrinos.com.br>")
    expect(lastEmail.recipients[0]).toBe("<registration@flow.com>")
    expect(lastEmail.subject).toBe(`Ative seu cadastro!`)
    expect(lastEmail.text).toContain(`RegistrationFlow`)
    expect(lastEmail.text).toContain(activationToken)
  })

  test("Activate account", async () => {
    // Extrair o token do email de ativação
    const lastEmail = await orchestrator.getLastEmail()
    const tokenMatch = lastEmail.text.match(/ativar\/([a-f0-9]+)/)
    expect(tokenMatch).toBeTruthy()

    const activationToken = tokenMatch[1]

    // Fazer a requisição de ativação
    const activationResponse = await fetch(
      "http://localhost:3000/api/v1/activation",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: activationToken,
        }),
      },
    )

    expect(activationResponse.status).toBe(200)

    const activationBody = await activationResponse.json()

    expect(activationBody).toEqual({
      message: "Conta ativada com sucesso!",
      user: {
        id: expect.any(String),
        username: "RegistrationFlow",
        email: "registration@flow.com",
      },
    })
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
