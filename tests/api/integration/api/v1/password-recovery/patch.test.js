import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("PATCH /api/v1/password-recovery/[token]", () => {
  describe("Anonymous user", () => {
    test("resetting password with valid token", async () => {
      // 1. Criar um usuário
      const user = await orchestrator.createUser({
        full_name: "User To Reset",
        email: "reset@example.com",
        password: "old-password",
      })
      await orchestrator.activateUser(user.id)

      // 2. Solicitar recuperação para gerar o token
      await fetch(`${orchestrator.webserverUrl}/api/v1/password-recovery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      })

      // 3. Pegar o token via E-mail
      const lastEmail = await orchestrator.getLastEmail()
      const tokenMatch = lastEmail.text.match(/reset-password\/([a-f0-9]+)/)
      expect(tokenMatch).toBeTruthy()
      const recoveryToken = tokenMatch[1]

      // 4. Resetar a senha
      const resetResponse = await fetch(
        `${orchestrator.webserverUrl}/api/v1/password-recovery/${recoveryToken}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: "new-password" }),
        },
      )

      expect(resetResponse.status).toBe(200)
      const resetResponseBody = await resetResponse.json()
      expect(resetResponseBody.message).toBe("Senha alterada com sucesso.")

      // 5. Tentar logar com a senha antiga (deve falhar)
      const loginOldResponse = await fetch(
        `${orchestrator.webserverUrl}/api/v1/sessions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, password: "old-password" }),
        },
      )
      expect(loginOldResponse.status).toBe(401)

      // 6. Tentar logar com a nova senha (deve funcionar)
      const loginNewResponse = await fetch(
        `${orchestrator.webserverUrl}/api/v1/sessions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, password: "new-password" }),
        },
      )
      expect(loginNewResponse.status).toBe(201)
    })

    test("resetting password with expired token", async () => {
      const user = await orchestrator.createUser({
        full_name: "Expired Token User",
        email: "expired@example.com",
        password: "password",
      })

      const expiredToken = "expired-token-123"
      await orchestrator.injectPasswordRecoveryToken({
        token: expiredToken,
        user_id: user.id,
        expires_at: new Date(Date.now() - 10000),
      })

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/password-recovery/${expiredToken}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: "new-password" }),
        },
      )

      expect(response.status).toBe(400)
      const responseBody = await response.json()
      expect(responseBody.message).toBe(
        "Token de recuperação inválido ou expirado.",
      )
    })

    test("resetting password with already used token", async () => {
      const user = await orchestrator.createUser({
        full_name: "Used Token User",
        email: "used@example.com",
        password: "password",
      })

      const usedToken = "used-token-123"
      await orchestrator.injectPasswordRecoveryToken({
        token: usedToken,
        user_id: user.id,
        used_at: new Date(),
      })

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/password-recovery/${usedToken}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: "new-password" }),
        },
      )

      expect(response.status).toBe(400)
      const responseBody = await response.json()
      expect(responseBody.message).toBe(
        "Token de recuperação inválido ou expirado.",
      )
    })
  })
})
