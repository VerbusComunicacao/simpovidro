import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("GET /api/v1/companies", () => {
  describe("Anonymous user", () => {
    test("Search for existing company with masked CNPJ using clean CNPJ", async () => {
      // 1. Create a company with masked CNPJ
      const maskedCnpj = "11.111.111/1111-11"
      const cleanCnpj = "11111111111111"

      const postResponse = await fetch(
        "http://localhost:3000/api/v1/companies",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            corporate_name: "Empresa Mascarada",
            badge: "Mascara",
            cnpj: maskedCnpj,
            address: "Rua X",
            address_number: "123",
            neighborhood: "Centro",
            city: "Rio",
            state: "RJ",
            phone: "12345678",
            email: "contato@mascara.com",
            responsible_person: "Mascara",
            zip_code: "12345-678",
            permission: "A",
            discount_status: "N",
          }),
        },
      )

      expect(postResponse.status).toBe(201)

      // 2. Search for it using clean CNPJ
      const getResponse = await fetch(
        `http://localhost:3000/api/v1/companies?cnpj=${cleanCnpj}`,
      )

      // If the bug exists, this might return 404 because the DB has the masked version
      expect(getResponse.status).toBe(200)

      const responseBody = await getResponse.json()
      expect(responseBody.cnpj).toBe(cleanCnpj) // We expect it to be cleaned in the response too or at least found
    })
  })
})
