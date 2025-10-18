import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "infra/errors.js"
import user from "./user.js"
import password from "./password.js"
import authorization from "./authorization.js"

async function getAuthenticatedUser(providedEmail, providedPassword) {
  try {
    const storedUser = await findUserByEmail(providedEmail)
    await validatePassword(providedPassword, storedUser.password)
    await validateUserCanCreateSession(storedUser)

    return storedUser
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: "Dados de autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos.",
      })
    }
    throw error
  }

  async function findUserByEmail(providedEmail) {
    let storedUser
    try {
      storedUser = await user.findOneByEmail(providedEmail)
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new UnauthorizedError({
          message: "Email não confere.",
          action: "Verifique se este dado está correto.",
        })
      }
      throw error
    }
    return storedUser
  }

  async function validatePassword(providedPassword, storedPassword) {
    const correctPasswordMatch = await password.compare(
      providedPassword,
      storedPassword,
    )

    if (!correctPasswordMatch) {
      throw new UnauthorizedError({
        message: "Senha não confere.",
        action: "Verifique se este dado está correto.",
      })
    }
  }

  async function validateUserCanCreateSession(user) {
    if (!authorization.can(user, "create:session")) {
      throw new ForbiddenError({
        message: "Usuário não confirmou o e-mail.",
        action: "Verifique sua caixa de entrada e ative sua conta.",
      })
    }
  }
}

const authentication = {
  getAuthenticatedUser,
}

export default authentication
