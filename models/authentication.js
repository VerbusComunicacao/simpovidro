import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "infra/errors.js"
import user from "./user.js"
import password from "./password.js"
import authorization from "./authorization.js"

async function getAuthenticatedUser(providedEmail, providedPassword, lang) {
  const isEn = lang === "en"
  try {
    const storedUser = await findUserByEmail(providedEmail)
    await validatePassword(providedPassword, storedUser.password)
    await validateUserCanCreateSession(storedUser)

    return storedUser
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: isEn
          ? "Authentication credentials do not match."
          : "Dados de autenticação não conferem.",
        action: isEn
          ? "Please check that the submitted information is correct."
          : "Verifique se os dados enviados estão corretos.",
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
          message: isEn ? "Incorrect email." : "Email não confere.",
          action: isEn
            ? "Please verify if the submitted email is correct."
            : "Verifique se este dado está correto.",
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
        message: isEn ? "Incorrect password." : "Senha não confere.",
        action: isEn
          ? "Please verify if the submitted password is correct."
          : "Verifique se este dado está correto.",
      })
    }
  }

  async function validateUserCanCreateSession(user) {
    if (!authorization.can(user, "create:session")) {
      throw new ForbiddenError({
        message: isEn
          ? "User has not confirmed their email."
          : "Usuário não confirmou o e-mail.",
        action: isEn
          ? "Please check your inbox and activate your account."
          : "Verifique sua caixa de entrada e ative sua conta.",
      })
    }
  }
}

const authentication = {
  getAuthenticatedUser,
}

export default authentication
