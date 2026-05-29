import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import authorization from "models/authorization.js"
import guest from "models/guest.js"

import { UnauthorizedError } from "infra/errors.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.get(getHandler)
router.post(controller.canRequest("create:guest"), postHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  const user = request.context.user
  if (!user.id) {
    throw new UnauthorizedError({
      message: "Usuário não autenticado.",
      action: "Faça login para continuar.",
    })
  }

  const page = parseInt(request.query.page, 10) || 1
  const limit = parseInt(request.query.limit, 10) || 10
  const search = request.query.search || ""

  const hasReadContent = user.features.includes("read:content")
  const isCpfSearch = search && search.replace(/\D/g, "").length === 11

  if (!hasReadContent && !isCpfSearch) {
    return response.status(403).json({
      name: "ForbiddenError",
      message: "Você não possui permissão para executar esta ação.",
      action: 'Verifique se este usuário possui a feature "read:content".',
      status_code: 403,
    })
  }

  const guestsData = await guest.findAll({ search, page, limit })

  let secureGuests
  if (hasReadContent) {
    secureGuests = authorization.filterOutput(
      request.context.user,
      "read:content",
      guestsData.data,
    )
  } else {
    secureGuests = guestsData.data
  }

  response.status(200).json({
    data: secureGuests,
    meta: guestsData.meta,
  })
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
