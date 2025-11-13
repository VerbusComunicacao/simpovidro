import { version as uuidVersion } from "uuid"
import orchestrator from "tests/orchestrator.js"
import session from "models/session.js"
import setCookieParser from "set-cookie-parser"

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.runPendingMigrations()
})

describe("GET /api/v1/users/[username]", () => {
  describe("Default user", () => {
    test("With valid session", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithValidSession",
      })
      await orchestrator.activateUser(createdUser.id)

      const sessionObject = await orchestrator.createSession(createdUser.id)

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: { Cookie: `session_id=${sessionObject.token}` },
      })

      expect(response.status).toBe(200)
      const cacheControl = response.headers.get("Cache-Control")
      expect(cacheControl).toBe(
        "no-store, no-cache, max-age=0, must-revalidate",
      )
      const responseBody = await response.json()

      expect(responseBody).toEqual({
        id: createdUser.id,
        username: "UserWithValidSession",
        email: createdUser.email,
        features: [
          "create:session",
          "read:session",
          "create:guest",
          "read:guest",
        ],
        password: createdUser.password,
        created_at: createdUser.created_at.toISOString(),
        updated_at: expect.any(String),
      })

      expect(uuidVersion(responseBody.id)).toBe(4)
      expect(Date.parse(responseBody.created_at)).not.toBeNaN()
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN()

      //Sessions renewal assertions

      const renewedSessionObject = await session.findOneValidByToken(
        sessionObject.token,
      )

      expect(renewedSessionObject.expires_at > sessionObject.expires_at).toBe(
        true,
      )
      expect(renewedSessionObject.updated_at > sessionObject.updated_at).toBe(
        true,
      )

      // Set-Cookie assertions

      const parsedSetCookie = setCookieParser(response, {
        map: true,
      })

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: renewedSessionObject.token,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        path: "/",
        httpOnly: true,
      })
    })

    test("With session close to expiration", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILLISECONDS + 6000),
      })

      const createdUser = await orchestrator.createUser({
        username: "UserWithHalfValidSession",
      })

      const sessionObject = await orchestrator.createSession(createdUser.id)

      jest.useRealTimers()

      await orchestrator.activateUser(createdUser.id)

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: { Cookie: `session_id=${sessionObject.token}` },
      })

      expect(response.status).toBe(200)

      const responseBody = await response.json()

      expect(responseBody).toEqual({
        id: createdUser.id,
        username: "UserWithHalfValidSession",
        email: createdUser.email,
        features: [
          "create:session",
          "read:session",
          "create:guest",
          "read:guest",
        ],
        password: createdUser.password,
        created_at: createdUser.created_at.toISOString(),
        updated_at: expect.any(String),
      })

      expect(uuidVersion(responseBody.id)).toBe(4)
      expect(Date.parse(responseBody.created_at)).not.toBeNaN()
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN()

      //Sessions renewal assertions

      const renewedSessionObject = await session.findOneValidByToken(
        sessionObject.token,
      )

      expect(renewedSessionObject.expires_at > sessionObject.expires_at).toBe(
        true,
      )
      expect(renewedSessionObject.updated_at > sessionObject.updated_at).toBe(
        true,
      )

      // Set-Cookie assertions

      const parsedSetCookie = setCookieParser(response, {
        map: true,
      })

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: renewedSessionObject.token,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        path: "/",
        httpOnly: true,
      })
    })

    test("With nonexistent session", async () => {
      const nonexistentToken =
        "9c220f57780d9ba82889530d262ccd19c69730efe2738e88e0ebd79299f9175ad63d11588ad882e26ffd64e686dcb02a"

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: { Cookie: `session_id=${nonexistentToken}` },
      })

      expect(response.status).toBe(401)
      const responseBody = await response.json()

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
        status_code: 401,
      })
    })

    test("With expired session", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILLISECONDS),
      })

      const createdUser = await orchestrator.createUser({
        username: "UserWithExpiredSession",
      })

      const sessionObject = await orchestrator.createSession(createdUser.id)

      jest.useRealTimers()

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: { Cookie: `session_id=${sessionObject.token}` },
      })

      expect(response.status).toBe(401)
      const responseBody = await response.json()

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
        status_code: 401,
      })
    })
  })
})
