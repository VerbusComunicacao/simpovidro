import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import authorization from "models/authorization.js"
import theme from "models/theme.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.get(controller.canRequest("read:content"), getHandler)
router.post(controller.canRequest("update:content"), postHandler)
router.delete(controller.canRequest("update:content"), deleteHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  const themeSettings = await theme.findOneByUserId(request.context.user.id)

  const secureTheme = authorization.filterOutput(
    request.context.user,
    "read:content",
    themeSettings,
  )

  response.status(200).json(secureTheme)
}

async function postHandler(request, response) {
  const colors = request.body.colors

  const themeUpdated = await theme.createOrUpdate(
    request.context.user.id,
    colors,
  )

  const secureTheme = authorization.filterOutput(
    request.context.user,
    "update:content",
    themeUpdated,
  )

  response.status(200).json(secureTheme)
}

async function deleteHandler(request, response) {
  await theme.resetToDefault(request.context.user.id)

  response.status(204).end()
}
