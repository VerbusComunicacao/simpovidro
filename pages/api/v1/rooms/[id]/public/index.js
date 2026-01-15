import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import room from "models/room.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.get(controller.canRequest("read:public-content"), getHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(req, res) {
  const { id } = req.query
  // We need a public version of findOneById that doesn't filter by userId
  const roomFound = await room.findOneById(id)
  res.status(200).json(roomFound)
}
