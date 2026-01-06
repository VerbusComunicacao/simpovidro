import { createRouter } from "next-connect"
import controller from "infra/controller"
import user from "models/user.js"
import session from "models/session.js"
import authorization from "models/authorization.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.get(controller.canRequest("read:session"), getHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  const sessionToken = request.cookies.session_id

  const sessionObject = await session.findOneValidByToken(sessionToken)
  const renewedSession = await session.renew(sessionObject.id)
  controller.setSessionCookie(renewedSession.token, response)

  const userFound = await user.findOneById(sessionObject.user_id)
  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  )

  const secureUserFound = authorization.filterOutput(
    request.context.user,
    "read:session",
    userFound,
  )

  response.status(200).json(secureUserFound)
}
