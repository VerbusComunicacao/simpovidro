import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import { ValidationError } from "infra/errors.js"
import tournament from "models/tournament.js"

const router = createRouter()
router.use(controller.injectAnnonymousOrUser)
router.get(getHandler)
router.post(postHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  const user = request.context.user

  if (!user || !user.id) {
    throw new ValidationError({
      message: "Você precisa estar logado para acessar as inscrições dos torneios.",
      action: "Faça login e tente novamente.",
    })
  }

  const registrations = await tournament.findByUserId(user.id)
  return response.status(200).json(registrations)
}

async function postHandler(request, response) {
  const user = request.context.user

  if (!user || !user.id) {
    throw new ValidationError({
      message: "Você precisa estar logado para realizar inscrições nos torneios.",
      action: "Faça login e tente novamente.",
    })
  }

  const body = request.body

  if (!body) {
    throw new ValidationError({
      message: "Corpo da requisição não informado.",
      action: "Envie os dados da inscrição para prosseguir.",
    })
  }

  let result
  if (Array.isArray(body.participants) || Array.isArray(body)) {
    const list = Array.isArray(body) ? body : body.participants
    result = await tournament.createMany(list, user.id)
    return response.status(201).json(result)
  } else {
    result = await tournament.create(body, user.id)
    return response.status(201).json(result)
  }
}
