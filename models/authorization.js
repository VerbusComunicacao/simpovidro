import { ValidationError } from "infra/errors.js"
import availableFeatures from "./user-features.js"

function can(user, feature, resource) {
  validateUser(user)
  validateFeature(feature)

  if (!user.features.includes(feature)) return false

  switch (feature) {
    case "update:user":
      return resource?.id && user.id === resource.id

    case "update:content":
      return (
        (resource?.owner_id && user.id === resource.owner_id) ||
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

const authorization = {
  can,
}

export default authorization
