import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("PATCH /api/v1/hotels/[id] (Activation)", () => {
  test("activating one hotel should deactivate others", async () => {
    // 1. Create a user and two hotels
    const user = await orchestrator.createUser({
      full_name: "Hotel Owner",
      email: "owner@hotels.com",
      password: "password123",
    })
    await orchestrator.activateAdmUser(user.id)
    const session = await orchestrator.createSession(user.id)

    // Create Hotel A
    const hotelAResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/hotels`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({
          name: "Hotel A",
          city: "City A",
          country: "Brasil",
          check_in_date: "2026-01-07T20:43:12.021Z",
          check_out_date: "2026-01-10T20:43:12.021Z",
        }),
      },
    )
    const hotelA = await hotelAResponse.json()

    // Create Hotel B
    const hotelBResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/hotels`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({
          name: "Hotel B",
          city: "City B",
          country: "Brasil",
          check_in_date: "2026-01-07T20:43:12.021Z",
          check_out_date: "2026-01-10T20:43:12.021Z",
        }),
      },
    )
    const hotelB = await hotelBResponse.json()

    // 2. Activate Hotel A
    const activateAResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/hotels/${hotelA.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({ active: true }),
      },
    )
    const activatedA = await activateAResponse.json()
    expect(activateAResponse.status).toBe(200)
    expect(activatedA.active).toBe(true)

    // 3. Activate Hotel B and check if A is deactivated
    const activateBResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/hotels/${hotelB.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({ active: true }),
      },
    )
    const activatedB = await activateBResponse.json()
    expect(activateBResponse.status).toBe(200)
    expect(activatedB.active).toBe(true)

    // 4. Fetch Hotel A again to verify it is inactive
    const getAResponse = await fetch(
      `${orchestrator.webserverUrl}/api/v1/hotels/${hotelA.id}`,
      {
        headers: {
          Cookie: `session_id=${session.token}`,
        },
      },
    )
    const fetchedA = await getAResponse.json()
    expect(fetchedA.active).toBe(false)
  })
})
