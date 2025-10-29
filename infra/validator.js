import { ValidationError } from "./errors.js"

/**
 * Módulo centralizado de validações para o sistema
 */

/**
 * Valida se uma string é um UUID válido
 * @param {string} str - String para validar
 * @throws {ValidationError} - Se o UUID não for válido
 */
export function validateUUID(str) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  const isValidUUID = uuidRegex.test(str)

  if (!isValidUUID) {
    throw new ValidationError({
      message: "UUID informado não é válido",
      action: "Verifique se o ID fornecido está no formato correto",
    })
  }
}

/**
 * Valida se um email tem formato válido
 * @param {string} email - Email para validar
 * @throws {ValidationError} - Se o email não for válido
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!email || !emailRegex.test(email)) {
    throw new ValidationError({
      message: "Email informado não é válido",
      action:
        "Verifique se o email está no formato correto (exemplo@dominio.com)",
    })
  }
}

/**
 * Valida se uma senha atende aos critérios mínimos
 * @param {string} password - Senha para validar
 * @param {Object} options - Opções de validação
 * @param {number} options.minLength - Tamanho mínimo da senha (padrão: 8)
 * @param {boolean} options.requireUppercase - Se deve ter letra maiúscula (padrão: true)
 * @param {boolean} options.requireLowercase - Se deve ter letra minúscula (padrão: true)
 * @param {boolean} options.requireNumber - Se deve ter número (padrão: true)
 * @param {boolean} options.requireSpecialChar - Se deve ter caractere especial (padrão: true)
 * @throws {ValidationError} - Se a senha não atender aos critérios
 */
export function validatePassword(password, options = {}) {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = true,
    requireSpecialChar = true,
  } = options

  if (!password) {
    throw new ValidationError({
      message: "Senha é obrigatória",
      action: "Informe uma senha válida",
    })
  }

  if (password.length < minLength) {
    throw new ValidationError({
      message: `Senha deve ter pelo menos ${minLength} caracteres`,
      action: "Crie uma senha mais longa",
    })
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    throw new ValidationError({
      message: "Senha deve conter pelo menos uma letra maiúscula",
      action: "Adicione uma letra maiúscula à sua senha",
    })
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    throw new ValidationError({
      message: "Senha deve conter pelo menos uma letra minúscula",
      action: "Adicione uma letra minúscula à sua senha",
    })
  }

  if (requireNumber && !/\d/.test(password)) {
    throw new ValidationError({
      message: "Senha deve conter pelo menos um número",
      action: "Adicione um número à sua senha",
    })
  }

  if (requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    throw new ValidationError({
      message: "Senha deve conter pelo menos um caractere especial",
      action:
        'Adicione um caractere especial (!@#$%^&*(),.?":{}|<>) à sua senha',
    })
  }
}

/**
 * Valida se campos obrigatórios estão presentes
 * @param {Object} data - Objeto com os dados para validar
 * @param {Array<string>} requiredFields - Array com os nomes dos campos obrigatórios
 * @throws {ValidationError} - Se algum campo obrigatório estiver ausente
 */
export function validateRequiredFields(data, requiredFields) {
  const missing = requiredFields.filter((field) => !data?.[field])

  if (missing.length > 0) {
    throw new ValidationError({
      message: `Campos obrigatórios ausentes: ${missing.join(", ")}.`,
      action: "Envie todos os campos obrigatórios e tente novamente.",
    })
  }
}

/**
 * Valida se um valor está dentro de um range numérico
 * @param {number} value - Valor para validar
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 * @param {string} fieldName - Nome do campo para mensagem de erro
 * @throws {ValidationError} - Se o valor estiver fora do range
 */
export function validateRange(value, min, max, fieldName = "Valor") {
  if (value < min || value > max) {
    throw new ValidationError({
      message: `${fieldName} deve estar entre ${min} e ${max}`,
      action: "Ajuste o valor para estar dentro do range permitido",
    })
  }
}

/**
 * Valida se uma string tem tamanho adequado
 * @param {string} str - String para validar
 * @param {number} minLength - Tamanho mínimo
 * @param {number} maxLength - Tamanho máximo
 * @param {string} fieldName - Nome do campo para mensagem de erro
 * @throws {ValidationError} - Se a string não atender aos critérios
 */
export function validateStringLength(
  str,
  minLength,
  maxLength,
  fieldName = "Campo",
) {
  if (!str || str.length < minLength) {
    throw new ValidationError({
      message: `${fieldName} deve ter pelo menos ${minLength} caracteres`,
      action: "Aumente o tamanho do texto",
    })
  }

  if (str.length > maxLength) {
    throw new ValidationError({
      message: `${fieldName} deve ter no máximo ${maxLength} caracteres`,
      action: "Reduza o tamanho do texto",
    })
  }
}

/**
 * Valida se um username tem formato válido
 * @param {string} username - Username para validar
 * @throws {ValidationError} - Se o username não for válido
 */
export function validateUsername(username) {
  // Username deve ter 3-20 caracteres, apenas letras, números, underscore e hífen
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/

  if (!username || !usernameRegex.test(username)) {
    throw new ValidationError({
      message:
        "Username deve ter entre 3 e 20 caracteres e conter apenas letras, números, underscore (_) e hífen (-)",
      action: "Ajuste o formato do username",
    })
  }
}

/**
 * Valida se um telefone tem formato válido (Brasil)
 * @param {string} phone - Telefone para validar
 * @throws {ValidationError} - Se o telefone não for válido
 */
export function validatePhone(phone) {
  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, "")

  // Telefone brasileiro: 10 ou 11 dígitos
  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    throw new ValidationError({
      message: "Telefone deve ter 10 ou 11 dígitos",
      action: "Verifique se o telefone está no formato correto",
    })
  }
}

/**
 * Valida se uma data está em formato válido
 * @param {string} dateString - Data para validar
 * @param {string} fieldName - Nome do campo para mensagem de erro
 * @throws {ValidationError} - Se a data não for válida
 */
export function validateDate(dateString, fieldName = "Data") {
  const date = new Date(dateString)

  if (isNaN(date.getTime())) {
    throw new ValidationError({
      message: `${fieldName} não é uma data válida`,
      action: "Verifique se a data está no formato correto",
    })
  }
}

/**
 * Valida se uma data está no futuro
 * @param {string} dateString - Data para validar
 * @param {string} fieldName - Nome do campo para mensagem de erro
 * @throws {ValidationError} - Se a data não estiver no futuro
 */
export function validateFutureDate(dateString, fieldName = "Data") {
  validateDate(dateString, fieldName)

  const date = new Date(dateString)
  const now = new Date()

  if (date <= now) {
    throw new ValidationError({
      message: `${fieldName} deve ser uma data futura`,
      action: "Selecione uma data posterior à data atual",
    })
  }
}

/**
 * Valida se uma data está no passado
 * @param {string} dateString - Data para validar
 * @param {string} fieldName - Nome do campo para mensagem de erro
 * @throws {ValidationError} - Se a data não estiver no passado
 */
export function validatePastDate(dateString, fieldName = "Data") {
  validateDate(dateString, fieldName)

  const date = new Date(dateString)
  const now = new Date()

  if (date >= now) {
    throw new ValidationError({
      message: `${fieldName} deve ser uma data passada`,
      action: "Selecione uma data anterior à data atual",
    })
  }
}
