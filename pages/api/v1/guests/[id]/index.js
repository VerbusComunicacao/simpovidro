import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import authorization from "models/authorization.js"
import guest from "models/guest.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.get(controller.canRequest("read:guest"), getHandler)
router.patch(controller.canRequest("update:guest"), patchHandler)
router.delete(controller.canRequest("delete:guest"), deleteHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  const { id } = request.query

  const guestFound = await guest.findOneById(id)

  const secureGuest = authorization.filterOutput(
    request.context.user,
    "read:guest",
    guestFound,
  )

  response.status(200).json(secureGuest)
}

async function patchHandler(request, response) {
  const { id } = request.query

  const guestInputValues = request.body

  const guestUpdated = await guest.update(id, guestInputValues)

  const secureGuestUpdated = authorization.filterOutput(
    request.context.user,
    "update:guest",
    guestUpdated,
  )

  response.status(200).json(secureGuestUpdated)
}

async function deleteHandler(request, response) {
  const { id } = request.query

  const guestFounded = await guest.findOneById(id)
  console.log("guest-user-id", guestFounded.user_id)
  console.log("user-id", request.context.user.id)

  if (!authorization.can(request.context.user, "delete:guest", guestFounded)) {
    return response.status(403).json({
      name: "ForbiddenError",
      message: "Você não possui permissão para deletar este convidado.",
      action: "Verifique se você possui permissão para executar esta ação.",
      status_code: 403,
    })
  }

  await guest.deleteById(id)

  response.status(204).end()
}
