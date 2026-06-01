import { cpf, cnpj } from "cpf-cnpj-validator"

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
