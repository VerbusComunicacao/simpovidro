import email from "infra/email.js"
import orchestrator from "tests/orchestrator"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
})

describe("infra/email.js", () => {
  test("send", async () => {
    await email.send({
      from: "Peregrinos <contato@peregrinos.com>",
      to: "contato@curso.dev",
      subject: "Teste de assunto",
      text: "Teste decorpo",
    })

    await email.send({
      from: "Peregrinos <contato@peregrinos.com>",
      to: "contato@curso.dev",
      subject: "Ultimo email enviado",
      text: "corpo do último email.",
    })

    const lastEmail = await orchestrator.getLastEmail()

    expect(lastEmail.sender).toBe("<contato@peregrinos.com>")
    expect(lastEmail.recipients[0]).toBe("<contato@curso.dev>")
    expect(lastEmail.subject).toBe("Ultimo email enviado")
    expect(lastEmail.text).toBe("corpo do último email.\r\n")
  })
})
