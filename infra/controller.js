import * as cookie from "cookie"
import session from "models/session.js"

import {
  ConflictError,
  ForbiddenError,
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "infra/errors"
import user from "models/user.js"
import authorization from "models/authorization"

function onErrorHandler(error, request, response) {
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof ConflictError ||
    error instanceof ForbiddenError
  ) {
    return response.status(error.statusCode).json(error)
  }

  if (error instanceof UnauthorizedError) {
    clearSessionCookie(response)
    return response.status(error.statusCode).json(error)
  }

  const publicErrorObject = new InternalServerError({
    cause: error,
  })
  2
  console.log(publicErrorObject)

  response.status(publicErrorObject.statusCode).json(publicErrorObject)
}

function onNoMatchHanler(request, response) {
  const publicErrorObject = new MethodNotAllowedError()

  response.status(publicErrorObject.statusCode).json(publicErrorObject)
}

async function setSessionCookie(sessionToken, response) {
  const setCookie = cookie.serialize("session_id", sessionToken, {
    path: "/",
    maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  })

  response.setHeader("Set-Cookie", setCookie)
}

async function clearSessionCookie(response) {
  const setCookie = cookie.serialize("session_id", "invalid", {
    path: "/",
    maxAge: -1,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  })

  response.setHeader("Set-Cookie", setCookie)
}

async function injectAnnonymousOrUser(request, response, next) {
  // 1. se o cookie session_id existe, injetar o usuário
  const sessionToken = request.cookies.session_id
  if (sessionToken) {
    await injectAuthenticatedUser(request)
    return next()
  }

  injectAnonymousUser(request)
  return next()
}

async function injectAuthenticatedUser(request) {
  const sessionToken = request.cookies.session_id
  const sessionObject = await session.findOneValidByToken(sessionToken)
  const userObject = await user.findOneById(sessionObject.user_id)

  request.context = {
    ...request.context,
    user: userObject,
  }
}

function injectAnonymousUser(request) {
  const anonymousUserObject = {
    features: ["read:activation_token", "create:user", "create:session"],
  }

  request.context = {
    ...request.context,
    user: anonymousUserObject,
  }
}

function canRequest(feature) {
  return function canRequestHandler(request, response, next) {
    const userTryingToRequest = request.context.user

    if (userTryingToRequest.features.includes(feature)) {
      return next()
    }

    if (!userTryingToRequest.id) {
      throw new UnauthorizedError({
        message: `Usuário não autenticado.`,
        action: `Faça novamente o login para continuar.`,
      })
    }

    throw new ForbiddenError({
      message: `Você não possui permissão para executar esta ação.`,
      action: `Verifique se este usuário possui a feature "${feature}".`,
    })
  }
}

const controller = {
  errorHandlers: {
    onError: onErrorHandler,
    onNoMatch: onNoMatchHanler,
  },
  setSessionCookie,
  clearSessionCookie,
  injectAnnonymousOrUser,
  canRequest,
}

export default controller
