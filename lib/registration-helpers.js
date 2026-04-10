import { Temporal } from "@js-temporal/polyfill"

/**
 * Calcula o preço total da inscrição baseada em hóspedes, regas do quarto e convênio da empresa.
 *
 * @param {Object} room - Objeto do quarto contendo price_per_night, member_price_per_night, etc.
 * @param {Array} guests - Lista de hóspedes com birth_date.
 * @param {Object} foundCompany - Empresa vinculada (opcional).
 * @param {Array} globalDiscounts - Lista de todos os descontos ativos.
 * @returns {Object} - Resumo financeiro (total, descontos, flags).
 */
export function calculateTotalPrice(
  room,
  guests,
  foundCompany,
  globalDiscounts = [],
) {
  let total = 0
  let adultCount = 0
  let childCount = 0
  const policies = room.price_policies || []
  const referenceDate = new Date(room.hotel_check_in_date || new Date())

  let discountPercentage = 0
  let isAssociate = false

  if (foundCompany) {
    if (foundCompany.discount_id) {
      const matchingDiscount = globalDiscounts.find(
        (d) => d.id === foundCompany.discount_id,
      )
      if (
        matchingDiscount &&
        (matchingDiscount.name === "Associada" ||
          matchingDiscount.name === "Associado")
      ) {
        isAssociate = true
      }
    }

    if (isAssociate) {
      discountPercentage = 0
    } else if (
      foundCompany.custom_discount_percentage !== null &&
      foundCompany.custom_discount_percentage !== undefined
    ) {
      discountPercentage = Number(foundCompany.custom_discount_percentage)
    } else if (foundCompany.discount_id) {
      const matchingDiscount = globalDiscounts.find(
        (d) => d.id === foundCompany.discount_id,
      )
      if (matchingDiscount) {
        discountPercentage = Number(matchingDiscount.value)
      }
    }
  }

  const priceToUse = isAssociate
    ? Number(room.member_price_per_night || room.price_per_night)
    : Number(room.price_per_night)

  guests.forEach((guest) => {
    let percentage = 100 // Default to 100%
    let isAdult = true
    let age = null

    if (guest.birth_date) {
      const birth = new Date(guest.birth_date)
      age = referenceDate.getUTCFullYear() - birth.getUTCFullYear()
      const m = referenceDate.getUTCMonth() - birth.getUTCMonth()
      if (
        m < 0 ||
        (m === 0 && referenceDate.getUTCDate() < birth.getUTCDate())
      ) {
        age--
      }
      isAdult = age >= 18
      if (policies.length > 0) {
        for (const policy of policies) {
          if (age <= policy.max_age) {
            percentage = Number(policy.percentage)
            break
          }
        }
      }
    } else {
      // If no birth date, treat as adult by default or based on index if empty
      // But usually in admin flow we have the date
    }

    if (isAdult) adultCount++
    else childCount++

    total += priceToUse * (percentage / 100)
  })

  const discountAmount = total * (discountPercentage / 100)
  const finalTotal = total - discountAmount

  return {
    originalTotal: total,
    discountPercentage,
    discountAmount,
    finalTotal,
    adultCount,
    childCount,
    isAssociate,
  }
}

/**
 * Calcula o número máximo de parcelas permitidas baseado na data do evento.
 *
 * @param {string|Date} hotelCheckInDate - Data de início da hospedagem.
 * @returns {number} - Número máximo de parcelas.
 */
export function calculateMaxInstallments(hotelCheckInDate) {
  if (!hotelCheckInDate) return 1

  try {
    const today = Temporal.Now.plainDateISO()
    const eventDate = Temporal.PlainDate.from(
      typeof hotelCheckInDate === "string"
        ? hotelCheckInDate.split("T")[0]
        : hotelCheckInDate.toISOString().split("T")[0],
    )

    if (Temporal.PlainDate.compare(eventDate, today) < 0) return 1

    const monthsBetween = today
      .with({ day: 1 })
      .until(eventDate.with({ day: 1 }), { largestUnit: "months" }).months

    return monthsBetween + 1
  } catch (error) {
    console.error("Error calculating installments with Temporal:", error)
    return 1
  }
}

/**
 * Valida se a ocupação do quarto está dentro dos limites.
 *
 * @param {Object} room - Objeto do quarto contendo max_adults e max_children.
 * @param {number} adultCount - Quantidade de adultos identificada.
 * @param {number} childCount - Quantidade de crianças identificada.
 * @returns {Object} - { isValid: boolean, message: string }
 */
export function validateRoomCapacity(room, adultCount, childCount) {
  const maxAdults = room.max_adults || 0
  const maxChildren = room.max_children || 0

  if (adultCount > maxAdults) {
    return {
      isValid: false,
      message: `O número de adultos (${adultCount}) excede a capacidade máxima do quarto (${maxAdults}).`,
    }
  }

  if (childCount > maxChildren) {
    return {
      isValid: false,
      message: `O número de crianças (${childCount}) excede a capacidade máxima do quarto (${maxChildren}).`,
    }
  }

  return { isValid: true, message: "" }
}
