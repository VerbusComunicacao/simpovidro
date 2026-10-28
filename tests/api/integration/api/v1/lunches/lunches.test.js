import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("Lunches Admin API - CRUD Operations", () => {
  let adminUser
  let adminSession
  let regularUser
  let regularSession
  let activeHotel

  beforeAll(async () => {
    // 1. Create Admin User
    adminUser = await orchestrator.createUser({
      full_name: "Admin Lunches Test",
      email: "admin-lunches-crud@example.com",
      password: "password123",
    })
    await orchestrator.activateAdmUser(adminUser.id)
    await orchestrator.setUserFeatures(adminUser.id, [
      "create:session",
      "read:session",
      "create:content",
      "read:content",
      "update:content",
      "delete:content",
    ])
    adminSession = await orchestrator.createSession(adminUser.id)

    // 2. Create Regular User
    regularUser = await orchestrator.createUser({
      full_name: "Regular Lunches Test",
      email: "regular-lunches@example.com",
      password: "password123",
    })
    await orchestrator.activateUser(regularUser.id)
    regularSession = await orchestrator.createSession(regularUser.id)

    // 3. Create Hotel
    activeHotel = await orchestrator.createHotel(adminUser.id, {
      name: "Hotel Almoços Teste",
      city: "Florianópolis",
      country: "Brasil",
      check_in_date: "2026-11-05",
      check_out_date: "2026-11-08",
    })
    await orchestrator.activateHotel(activeHotel.id)
  })

  test("GET /api/v1/lunches returns auto-seeded default lunches", async () => {
    const res = await fetch(
      `${orchestrator.webserverUrl}/api/v1/lunches?hotel_id=${activeHotel.id}`,
    )
    expect(res.status).toBe(200)

    const list = await res.json()
    expect(Array.isArray(list)).toBe(true)
    expect(list.length).toBe(5)
    expect(list.map((l) => l.title)).toContain("Energia")
  })

  test("POST /api/v1/lunches - Unauthorized user cannot create lunch", async () => {
    const res = await fetch(`${orchestrator.webserverUrl}/api/v1/lunches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `session_id=${regularSession.token}`,
      },
      body: JSON.stringify({
        title: "Mesa Não Autorizada",
        speakers: "Fulano de Tal",
      }),
    })
    expect(res.status).toBe(403)
  })

  test("POST /api/v1/lunches - Admin can create a new lunch table", async () => {
    const res = await fetch(`${orchestrator.webserverUrl}/api/v1/lunches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `session_id=${adminSession.token}`,
      },
      body: JSON.stringify({
        hotel_id: activeHotel.id,
        title: "Inovação e Tecnologia",
        speakers: "Palestrante Convidado 1, Palestrante Convidado 2",
        active: true,
      }),
    })
    expect(res.status).toBe(201)

    const created = await res.json()
    expect(created.id).toBeDefined()
    expect(created.title).toBe("Inovação e Tecnologia")
    expect(created.speakers).toBe(
      "Palestrante Convidado 1, Palestrante Convidado 2",
    )
    expect(created.active).toBe(true)

    // Verify in GET list
    const getRes = await fetch(
      `${orchestrator.webserverUrl}/api/v1/lunches?hotel_id=${activeHotel.id}&include_inactive=true`,
    )
    const list = await getRes.json()
    expect(list.length).toBe(6)
  })

  test("GET /api/v1/lunches/[id] - returns specific lunch details", async () => {
    // Fetch all to get an ID
    const listRes = await fetch(
      `${orchestrator.webserverUrl}/api/v1/lunches?hotel_id=${activeHotel.id}`,
    )
    const list = await listRes.json()
    const target = list[0]

    const res = await fetch(
      `${orchestrator.webserverUrl}/api/v1/lunches/${target.id}`,
    )
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.id).toBe(target.id)
    expect(data.title).toBe(target.title)
  })

  test("PATCH /api/v1/lunches/[id] - Admin can update title, speakers and active status", async () => {
    const listRes = await fetch(
      `${orchestrator.webserverUrl}/api/v1/lunches?hotel_id=${activeHotel.id}`,
    )
    const list = await listRes.json()
    const target = list.find((l) => l.title === "Inovação e Tecnologia")

    const res = await fetch(
      `${orchestrator.webserverUrl}/api/v1/lunches/${target.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${adminSession.token}`,
        },
        body: JSON.stringify({
          title: "Inovação e Sustentabilidade",
          speakers: "Novo Palestrante Especial",
          active: false,
        }),
      },
    )
    expect(res.status).toBe(200)

    const updated = await res.json()
    expect(updated.title).toBe("Inovação e Sustentabilidade")
    expect(updated.speakers).toBe("Novo Palestrante Especial")
    expect(updated.active).toBe(false)

    // When fetching active lunches, this inactive one should NOT appear
    const activeRes = await fetch(
      `${orchestrator.webserverUrl}/api/v1/lunches?hotel_id=${activeHotel.id}`,
    )
    const activeList = await activeRes.json()
    expect(
      activeList.some((l) => l.title === "Inovação e Sustentabilidade"),
    ).toBe(false)

    // But with include_inactive=true it should appear
    const allRes = await fetch(
      `${orchestrator.webserverUrl}/api/v1/lunches?hotel_id=${activeHotel.id}&include_inactive=true`,
    )
    const allList = await allRes.json()
    expect(allList.some((l) => l.title === "Inovação e Sustentabilidade")).toBe(
      true,
    )
  })

  test("DELETE /api/v1/lunches/[id] - Regular user cannot delete lunch", async () => {
    const listRes = await fetch(
      `${orchestrator.webserverUrl}/api/v1/lunches?hotel_id=${activeHotel.id}&include_inactive=true`,
    )
    const list = await listRes.json()
    const target = list[0]

    const res = await fetch(
      `${orchestrator.webserverUrl}/api/v1/lunches/${target.id}`,
      {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${regularSession.token}`,
        },
      },
    )
    expect(res.status).toBe(403)
  })

  test("DELETE /api/v1/lunches/[id] - Admin can delete lunch", async () => {
    const listRes = await fetch(
      `${orchestrator.webserverUrl}/api/v1/lunches?hotel_id=${activeHotel.id}&include_inactive=true`,
    )
    const list = await listRes.json()
    const target = list.find((l) => l.title === "Inovação e Sustentabilidade")

    const res = await fetch(
      `${orchestrator.webserverUrl}/api/v1/lunches/${target.id}`,
      {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${adminSession.token}`,
        },
      },
    )
    expect(res.status).toBe(204)

    // Verify it is gone
    const afterRes = await fetch(
      `${orchestrator.webserverUrl}/api/v1/lunches/${target.id}`,
    )
    expect(afterRes.status).toBe(404)
  })
})
