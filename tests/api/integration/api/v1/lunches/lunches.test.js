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

describe("Lunches Admin API - date and time", () => {
  let adminSession
  let hotel

  const post = (body) =>
    fetch(`${orchestrator.webserverUrl}/api/v1/lunches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `session_id=${adminSession.token}`,
      },
      body: JSON.stringify({ hotel_id: hotel.id, ...body }),
    })

  const patch = (id, body) =>
    fetch(`${orchestrator.webserverUrl}/api/v1/lunches/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `session_id=${adminSession.token}`,
      },
      body: JSON.stringify(body),
    })

  beforeAll(async () => {
    const admin = await orchestrator.createUser({
      full_name: "Admin Lunches Date Test",
      email: "admin-lunches-date@example.com",
      password: "password123",
    })
    await orchestrator.activateAdmUser(admin.id)
    await orchestrator.setUserFeatures(admin.id, [
      "create:session",
      "read:session",
      "create:content",
      "read:content",
      "update:content",
    ])
    adminSession = await orchestrator.createSession(admin.id)

    hotel = await orchestrator.createHotel(admin.id, {
      name: "Hotel Almoços Data Teste",
      city: "Florianópolis",
      country: "Brasil",
      check_in_date: "2026-11-05",
      check_out_date: "2026-11-08",
    })
  })

  test("POST creates a lunch with date and time", async () => {
    const res = await post({
      title: "Mesa Sexta",
      speakers: "Fulano de Tal",
      lunch_date: "2026-11-06",
      lunch_time: "13:00",
    })
    expect(res.status).toBe(201)

    const created = await res.json()
    expect(created.lunch_date).toBe("2026-11-06")
    expect(created.lunch_time).toBe("13:00")
  })

  test("POST creates a lunch without date and time", async () => {
    const res = await post({ title: "Mesa Sem Data", speakers: "Ciclano" })
    expect(res.status).toBe(201)

    const created = await res.json()
    expect(created.lunch_date).toBeNull()
    expect(created.lunch_time).toBeNull()
  })

  test("PATCH updates and clears date and time", async () => {
    const created = await (
      await post({ title: "Mesa Editável", speakers: "Beltrano" })
    ).json()

    const updatedRes = await patch(created.id, {
      lunch_date: "2026-11-07",
      lunch_time: "12:30",
    })
    expect(updatedRes.status).toBe(200)
    const updated = await updatedRes.json()
    expect(updated.lunch_date).toBe("2026-11-07")
    expect(updated.lunch_time).toBe("12:30")

    const clearedRes = await patch(created.id, {
      lunch_date: null,
      lunch_time: null,
    })
    const cleared = await clearedRes.json()
    expect(cleared.lunch_date).toBeNull()
    expect(cleared.lunch_time).toBeNull()
  })

  test("POST with invalid date or time returns 400", async () => {
    const badDate = await post({
      title: "Mesa Data Ruim",
      speakers: "Fulano",
      lunch_date: "06/11/2026",
    })
    expect(badDate.status).toBe(400)
    expect((await badDate.json()).message).toBe("A data do almoço é inválida.")

    const impossibleDate = await post({
      title: "Mesa Data Impossível",
      speakers: "Fulano",
      lunch_date: "2026-02-31",
    })
    expect(impossibleDate.status).toBe(400)

    const badTime = await post({
      title: "Mesa Hora Ruim",
      speakers: "Fulano",
      lunch_time: "25:99",
    })
    expect(badTime.status).toBe(400)
    expect((await badTime.json()).message).toBe(
      "O horário do almoço é inválido.",
    )
  })

  test("GET lists lunches ordered by date, undated last", async () => {
    const res = await fetch(
      `${orchestrator.webserverUrl}/api/v1/lunches?hotel_id=${hotel.id}`,
    )
    const list = await res.json()
    const dates = list.map((l) => l.lunch_date)

    const dated = dates.filter(Boolean)
    expect(dated).toEqual([...dated].sort())
    expect(dates.indexOf(null)).toBeGreaterThan(dates.lastIndexOf(dated[0]))
  })
})
