import { ValidationError } from "infra/errors.js"
import availableFeatures from "./user-features.js"

function can(user, feature, resource) {
  validateUser(user)
  validateFeature(feature)

  if (!user.features.includes(feature)) return false

  switch (feature) {
    case "update:user":
      return (
        (resource?.user_id && user.id === resource.user_id) ||
        user.features.includes("update:user:others")
      )

    case "update:guest":
      return resource?.user_id && user.id === resource.user_id

    case "update:content":
    case "read:content":
    case "delete:guest":
    case "delete:content":
      if (!resource) return true
      return (
        (resource?.user_id && user.id === resource.user_id) ||
        user.features.includes("update:content:others")
      )
  }

  if (!resource) return true

  return false
}

function validateUser(user) {
  if (!user) {
    throw new ValidationError({
      message: `Nenhum "user" foi especificado para a ação de autorização.`,
      action: `Contate o suporte informado o campo "errorId".`,
    })
  }

  if (!user.features || !Array.isArray(user.features)) {
    throw new ValidationError({
      message: `"user" não possui "features" ou não é um array.`,
      action: `Contate o suporte informado o campo "errorId".`,
    })
  }
}

function validateFeature(feature) {
  if (!feature) {
    throw new ValidationError({
      message: `Nenhuma "feature" foi especificada para a ação de autorização.`,
      action: `Contate o suporte informado o campo "errorId".`,
    })
  }

  if (!availableFeatures.has(feature)) {
    throw new ValidationError({
      message: `A feature utilizada não está disponível na lista de features existentes.`,
      action: `Contate o suporte informado o campo "errorId".`,
      context: {
        feature: feature,
      },
    })
  }
}

function filterOutput(user, feature, output) {
  validateUser(user)
  validateFeature(feature)

  if (!user.features.includes(feature)) {
    return null
  }

  // Para listagens
  if (feature === "read:content" && Array.isArray(output)) {
    return output.map((item) => filterOutput(user, feature, item))
  }

  // Para itens individuais
  if (feature === "read:content") {
    const clonedOutput = { ...output }

    // Se o usuário não é o dono do recurso, remove campos sensíveis
    if (user.id !== output.user_id) {
      // Remove campos que só o dono deve ver
      delete clonedOutput.user_id
      delete clonedOutput.created_at
      delete clonedOutput.updated_at
    }

    return clonedOutput
  }

  return output
}

const authorization = {
  can,
  filterOutput,
}

export default authorization
