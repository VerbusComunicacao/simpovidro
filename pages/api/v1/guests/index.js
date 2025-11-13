import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import authorization from "models/authorization.js"
import guest from "models/guest.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.get(controller.canRequest("read:content"), getHandler)
router.post(controller.canRequest("create:guest"), postHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  const guests = await guest.findAll()

  const secureGuests = authorization.filterOutput(
    request.context.user,
    "read:content",
    guests,
  )

  response.status(200).json(secureGuests)
}

async function postHandler(request, response) {
  const guestInputValues = request.body

  const guestCreated = await guest.create(
    guestInputValues,
    request.context.user.id,
  )

  const secureGuest = authorization.filterOutput(
    request.context.user,
    "create:guest",
    guestCreated,
  )

  response.status(201).json(secureGuest)
}
