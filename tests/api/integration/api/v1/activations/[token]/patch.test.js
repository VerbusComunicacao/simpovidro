import database from "infra/database.js"
import orchestrator from "tests/orchestrator.js"
import guest from "models/guest.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
  await orchestrator.deleteAllEmails()
})

describe("PATCH /api/v1/activations/[token]", () => {
  test("Should sync guest user_id upon account activation and preserve all data", async () => {
    const targetEmail = "deep.sync@example.com"
    const guestData = {
      name: "Deep Sync Guest",
      email: targetEmail,
      phone: "(11) 97777-6666",
      badge_name: "Deep Sync",
      gender: "Female",
      rg_number: "RG_DEEP_123",
      cpf_number: "111.999.888-77",
      passport_number: "PASS_DEEP_456",
      medication_details: "Insulin",
      blood_type: "O",
      blood_rh_factor: "-",
      health_observations: "Very healthy",
      special_needs_details: "None",
      has_heart_condition: true,
      has_diabetes: true,
      has_high_blood_pressure: false,
      has_low_blood_pressure: true,
      birth_date: "1988-08-08",
      nationality: "Brasileira",
      address: "Av. Paulista",
      address_number: "1500",
      address_complement: "CJ 50",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
      country: "Brasil",
      emergency_contact_name: "Emergency Friend",
      emergency_contact_phone: "(11) 91111-1111",
      company_cnpj: "99888777000166",
    }

    // 1. Create a guest directly in the database without a user_id
    await database.query({
      text: `
        INSERT INTO guests (
          name, email, phone, badge_name, gender, rg_number, cpf_number, 
          passport_number, medication_details, blood_type, blood_rh_factor, 
          health_observations, special_needs_details, has_heart_condition, 
          has_diabetes, has_high_blood_pressure, has_low_blood_pressure, 
          birth_date, nationality, address, address_number, address_complement, 
          neighborhood, city, state, country, emergency_contact_name, 
          emergency_contact_phone, company_cnpj
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
        )`,
      values: [
        guestData.name,
        guestData.email,
        guestData.phone,
        guestData.badge_name,
        guestData.gender,
        guestData.rg_number,
        guestData.cpf_number,
        guestData.passport_number,
        guestData.medication_details,
        guestData.blood_type,
        guestData.blood_rh_factor,
        guestData.health_observations,
        guestData.special_needs_details,
        guestData.has_heart_condition,
        guestData.has_diabetes,
        guestData.has_high_blood_pressure,
        guestData.has_low_blood_pressure,
        guestData.birth_date,
        guestData.nationality,
        guestData.address,
        guestData.address_number,
        guestData.address_complement,
        guestData.neighborhood,
        guestData.city,
        guestData.state,
        guestData.country,
        guestData.emergency_contact_name,
        guestData.emergency_contact_phone,
        guestData.company_cnpj,
      ],
    })

    // Verify guest is there without user_id
    const guestBefore = await guest.findOneByCpfOrRg(
      guestData.cpf_number,
      guestData.rg_number,
    )
    expect(guestBefore.user_id).toBeNull()

    // 2. Create a user with the same email
    const createdUserResponse = await fetch(
      "http://localhost:3000/api/v1/users",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: "Deep Sync User",
          email: targetEmail,
          password: "password123",
        }),
      },
    )
    expect(createdUserResponse.status).toBe(201)
    const createdUserBody = await createdUserResponse.json()

    // 3. Get activation token from email
    const lastEmail = await orchestrator.getLastEmail()
    const tokenMatch = lastEmail.text.match(/cadastro\/ativar\/([a-f0-9]+)/)
    expect(tokenMatch).toBeTruthy()
    const activationToken = tokenMatch[1]

    // 4. Activate the account
    const activationResponse = await fetch(
      `http://localhost:3000/api/v1/activations/${activationToken}`,
      { method: "PATCH" },
    )
    expect(activationResponse.status).toBe(200)

    // 5. Verify the guest is now synced and all fields match
    const guestAfter = await guest.findOneByCpfOrRg(
      guestData.cpf_number,
      guestData.rg_number,
    )

    expect(guestAfter.user_id).toBe(createdUserBody.id)
    expect(guestAfter).toMatchObject({
      name: guestData.name,
      email: guestData.email,
      phone: guestData.phone,
      badge_name: guestData.badge_name,
      gender: guestData.gender,
      rg_number: guestData.rg_number,
      cpf_number: guestData.cpf_number,
      passport_number: guestData.passport_number,
      medication_details: guestData.medication_details,
      blood_type: guestData.blood_type,
      blood_rh_factor: guestData.blood_rh_factor,
      health_observations: guestData.health_observations,
      special_needs_details: guestData.special_needs_details,
      has_heart_condition: guestData.has_heart_condition,
      has_diabetes: guestData.has_diabetes,
      has_high_blood_pressure: guestData.has_high_blood_pressure,
      has_low_blood_pressure: guestData.has_low_blood_pressure,
      nationality: guestData.nationality,
      address: guestData.address,
      address_number: guestData.address_number,
      address_complement: guestData.address_complement,
      neighborhood: guestData.neighborhood,
      city: guestData.city,
      state: guestData.state,
      country: guestData.country,
      emergency_contact_name: guestData.emergency_contact_name,
      emergency_contact_phone: guestData.emergency_contact_phone,
      company_cnpj: guestData.company_cnpj,
    })

    expect(new Date(guestAfter.birth_date).toISOString().split("T")[0]).toBe(
      guestData.birth_date,
    )
  })
})
