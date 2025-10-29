export class InternalServerError extends Error {
  constructor({ cause, statusCode }) {
    super("Um erro interno não esperado aconteceu.", { cause })
    this.name = "InternalServerError"
    this.action = "Entre em contato com o suporte."
    this.statusCode = statusCode || 500
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    }
  }
}

export class ServiceError extends Error {
  constructor({ cause, message }) {
    super(message || "Serviço indisponível no momento.", { cause })
    this.name = "InternalServerError"
    this.action = "Verifique se o serviço está disponível"
    this.statusCode = 503
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    }
  }
}

export class ValidationError extends Error {
  constructor({ cause, message, action }) {
    super(message || "Um erro de validação ocorreu.", { cause })
    this.name = "ValidationError"
    this.action = action || "Ajuste os dados enviados e tente novamente."
    this.statusCode = 400
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    }
  }
}

export class ForbiddenError extends Error {
  constructor({ cause, message, action }) {
    super(message || "Você não possui permissão para executar esta ação.", {
      cause,
    })
    this.name = "ForbiddenError"
    this.action =
      action || "Verifique se você possui permissão para executar esta ação."
    this.statusCode = 403
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    }
  }
}

export class NotFoundError extends Error {
  constructor({ cause, message, action }) {
    super(message || "Não foi possível encontrar este recurso no sistema.", {
      cause,
    })
    this.name = "NotFoundError"
    this.action = action || "Verifique se parâmetros enviados estão certos."
    this.statusCode = 404
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    }
  }
}

export class ConflictError extends Error {
  constructor({ cause, message, action }) {
    super(message || "Um conflito foi detectado ao processar sua solicitação", {
      cause,
    })
    this.name = "ConflictError"
    this.action =
      action ||
      "Verifique se já existe um registro com os mesmos dados ou tente novamente com informações diferentes."
    this.statusCode = 409
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    }
  }
}

export class UnauthorizedError extends Error {
  constructor({ cause, message, action }) {
    super(message || "Usuário não autenticado.", {
      cause,
    })
    this.name = "UnauthorizedError"
    this.action = action || "Faça novamente o login para continuar."
    this.statusCode = 401
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    }
  }
}

export class MethodNotAllowedError extends Error {
  constructor() {
    super("Método não permitido para este endpoint.")
    this.name = "MethodNotAllowedError"
    this.action =
      "Verifique se o método HTTP enviado é válido para este endpoint."
    this.statusCode = 405
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    }
  }
}
