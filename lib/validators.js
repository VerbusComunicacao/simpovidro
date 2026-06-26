import { cpf, cnpj } from "cpf-cnpj-validator"
import { locales } from "./locales"

export const validateCPF = (value) => {
  if (!value) return false
  const cleanValue = value.replace(/\D/g, "")
  if (cleanValue === "11111111111") return true
  return cpf.isValid(value)
}

export const validateCNPJ = (value) => {
  if (!value) return false
  return cnpj.isValid(value)
}

export const validatePhone = (value) => {
  if (!value) return false
  // Remove non-digit characters
  const cleanValue = value.replace(/\D/g, "")
  // Valid phone numbers in Brazil are 10 or 11 digits
  return cleanValue.length === 10 || cleanValue.length === 11
}

export function getValidationMessage(target, isEn) {
  if (!target || !target.validity || target.validity.valid) return ""

  const validity = target.validity
  if (validity.customError) {
    return target.validationMessage
  }

  const locale = isEn ? "en" : "pt"
  const dict = locales[locale] || locales["pt"]

  const val = target.value || ""

  if (validity.valueMissing) {
    if (target.type === "checkbox") {
      return (
        dict["validation.checkboxMissing"] ||
        "Please check this box if you want to proceed."
      )
    }
    if (target.tagName?.toLowerCase() === "select") {
      return (
        dict["validation.selectMissing"] || "Please select an item in the list."
      )
    }
    return dict["validation.valueMissing"]
  }

  // Email validation rules
  if (
    target.type === "email" &&
    (validity.typeMismatch || !target.checkValidity())
  ) {
    if (!val.includes("@")) {
      return (dict["validation.emailMissingAt"] || "").replace("{value}", val)
    }
    const parts = val.split("@")
    if (parts.length < 2 || !parts[1]) {
      return (dict["validation.emailIncomplete"] || "").replace("{value}", val)
    }
    return dict["validation.emailInvalid"]
  }

  if (validity.typeMismatch) {
    if (target.type === "url") {
      return dict["validation.urlInvalid"]
    }
    return dict["validation.invalid"]
  }

  if (validity.tooShort) {
    const minLength = target.getAttribute("minlength") || ""
    return (dict["validation.tooShort"] || "")
      .replace("{minLength}", minLength)
      .replace("{length}", String(val.length))
  }

  if (validity.tooLong) {
    const maxLength = target.getAttribute("maxlength") || ""
    return (dict["validation.tooLong"] || "")
      .replace("{maxLength}", maxLength)
      .replace("{length}", String(val.length))
  }

  if (validity.rangeUnderflow) {
    const min = target.getAttribute("min") || ""
    return (dict["validation.rangeUnderflow"] || "").replace("{min}", min)
  }

  if (validity.rangeOverflow) {
    const max = target.getAttribute("max") || ""
    return (dict["validation.rangeOverflow"] || "").replace("{max}", max)
  }

  if (validity.patternMismatch) {
    return dict["validation.patternMismatch"]
  }

  if (validity.stepMismatch) {
    return dict["validation.stepMismatch"]
  }

  return dict["validation.invalid"]
}
