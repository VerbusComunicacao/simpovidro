import { createRouter } from "next-connect"
import controller from "infra/controller.js"
import registration from "models/registration.js"
import { ValidationError, UnauthorizedError } from "infra/errors.js"
import { sendRegistrationEmail } from "models/email-notifications.js"

const router = createRouter()

router.use(controller.injectAnnonymousOrUser)
router.post(postHandler)

export default router.handler(controller.errorHandlers)

async function postHandler(request, response) {
  const user = request.context.user
  const { guests_data, lang } = request.body

  if (!user.id) {
    throw new UnauthorizedError({
      message:
        lang === "en"
          ? "You must be logged in to register."
          : "Você precisa estar logado para realizar a inscrição.",
      action:
        lang === "en"
          ? "Please log in and try again."
          : "Faça login e tente novamente.",
    })
  }

  if (!Array.isArray(guests_data) || guests_data.length === 0) {
    throw new ValidationError({
      message:
        lang === "en"
          ? "At least one guest must be provided."
          : "É necessário informar pelo menos um hóspede.",
      action:
        lang === "en"
          ? "Add guest details and try again."
          : "Adicione os dados do hóspede e tente novamente.",
    })
  }

  // 1. Check for duplicate guests in the same request
  const usedCPFs = new Set()
  const usedRGs = new Set()
  const usedPassports = new Set()

  for (const currentGuestData of guests_data) {
    const cleanCpf = currentGuestData.cpf_number?.replace(/\D/g, "")
    const isPlaceholder =
      cleanCpf === "11111111111" || currentGuestData.is_pending_info === true

    if (!isPlaceholder) {
      if (
        currentGuestData.cpf_number &&
        usedCPFs.has(currentGuestData.cpf_number)
      ) {
        throw new ValidationError({
          message:
            lang === "en"
              ? "The guests provided cannot be identical (duplicate CPF)."
              : "Os hóspedes informados não podem ser iguais (CPF duplicado).",
          action:
            lang === "en"
              ? "Verify guest details and try again."
              : "Verifique os dados dos hóspedes e tente novamente.",
        })
      }
      if (
        currentGuestData.rg_number &&
        usedRGs.has(currentGuestData.rg_number)
      ) {
        throw new ValidationError({
          message:
            lang === "en"
              ? "The guests provided cannot be identical (duplicate RG)."
              : "Os hóspedes informados não podem ser iguais (RG duplicado).",
          action:
            lang === "en"
              ? "Verify guest details and try again."
              : "Verifique os dados dos hóspedes e tente novamente.",
        })
      }
      if (
        currentGuestData.passport_number &&
        usedPassports.has(currentGuestData.passport_number)
      ) {
        throw new ValidationError({
          message:
            lang === "en"
              ? "The guests provided cannot be identical (duplicate Passport)."
              : "Os hóspedes informados não podem ser iguais (Passaporte duplicado).",
          action:
            lang === "en"
              ? "Verify guest details and try again."
              : "Verifique os dados dos hóspedes e tente novamente.",
        })
      }
      if (currentGuestData.cpf_number) usedCPFs.add(currentGuestData.cpf_number)
      if (currentGuestData.rg_number) usedRGs.add(currentGuestData.rg_number)
      if (currentGuestData.passport_number)
        usedPassports.add(currentGuestData.passport_number)
    }
  }

  // 2. Delegate registration logic to model
  const registrationResult = await registration.create(user, request.body)
  const { saleId, guestIds } = registrationResult

  // 3. Send Confirmation Email
  await sendRegistrationEmail(saleId, { user })

  return response.status(201).json({
    saleId: saleId,
    guestIds: guestIds,
  })
}
