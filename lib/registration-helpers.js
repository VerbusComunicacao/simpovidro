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
      isAdult = age >= 12
      if (policies.length > 0) {
        for (const policy of policies) {
          if (age <= policy.max_age) {
            if (policy.use_percentage === false) {
              // Fixed price specific to this room/policy
              const baseForGuest = isAdult
                ? priceToUse
                : Number(room.price_per_night)
              total += Number(
                policy.price !== null ? policy.price : baseForGuest,
              )
              percentage = null // Signal that we already added the amount
            } else {
              percentage = Number(policy.percentage)
            }
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

    if (percentage !== null) {
      const baseForGuest = isAdult ? priceToUse : Number(room.price_per_night)
      total += baseForGuest * (percentage / 100)
    }
  })

  const adultTotal = adultCount * priceToUse
  const discountAmount = calculateAdultDiscount(adultTotal, discountPercentage)
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

    // Normaliza a data de entrada para Temporal.PlainDate
    let eventDate
    if (typeof hotelCheckInDate === "string") {
      eventDate = Temporal.PlainDate.from(hotelCheckInDate.split("T")[0])
    } else if (hotelCheckInDate.toISOString) {
      eventDate = Temporal.PlainDate.from(
        hotelCheckInDate.toISOString().split("T")[0],
      )
    } else {
      eventDate = Temporal.PlainDate.from(
        hotelCheckInDate.toString().split("T")[0],
      )
    }

    const limitDate = eventDate.subtract({ days: 6 })

    if (Temporal.PlainDate.compare(limitDate, today) <= 0) return 1

    let count = 1
    // Permite parcelamento apenas se as parcelas subsequentes caírem no mesmo dia da inscrição,
    // garantindo que não ultrapassam a data limite de 6 dias antes do evento.
    while (
      Temporal.PlainDate.compare(today.add({ months: count }), limitDate) <= 0
    ) {
      count++
    }

    return count
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
  const minRequired = room.min_guests || 1

  if (adultCount < minRequired) {
    return {
      isValid: false,
      message: `Este quarto exige no mínimo ${minRequired} hóspedes adultos.`,
    }
  }

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

/**
 * Gera as datas de vencimento das parcelas seguindo as regras de negócio:
 * 1. 1ª parcela: 5 dias após hoje.
 * 2. Parcelas intermediárias: no último dia de cada mês subsequente.
 * 3. Última parcela: 5 dias antes do evento.
 *
 * @param {number} count - Número de parcelas.
 * @param {string|Temporal.PlainDate} hotelCheckInDate - Data do evento.
 * @returns {Array<string>} - Lista de datas formatadas ISO.
 */
export function generateInstallmentDates(count, hotelCheckInDate) {
  if (!hotelCheckInDate) return []

  const dates = []
  const today = Temporal.Now.plainDateISO()

  // Normaliza a data de entrada para Temporal.PlainDate
  let eventDate
  if (typeof hotelCheckInDate === "string") {
    eventDate = Temporal.PlainDate.from(hotelCheckInDate.split("T")[0])
  } else if (hotelCheckInDate.toISOString) {
    eventDate = Temporal.PlainDate.from(
      hotelCheckInDate.toISOString().split("T")[0],
    )
  } else {
    eventDate = Temporal.PlainDate.from(
      hotelCheckInDate.toString().split("T")[0],
    )
  }

  const limitDate = eventDate.subtract({ days: 6 })

  for (let i = 0; i < count; i++) {
    let dueDate

    if (i === 0) {
      // 1ª parcela: 5 dias após a inscrição
      dueDate = today.add({ days: 5 })
    } else {
      // Demais parcelas: mesmo dia da inscrição em meses subsequentes
      dueDate = today.add({ months: i })
    }

    // Trava de segurança: data limite de 6 dias antes do evento
    if (Temporal.PlainDate.compare(dueDate, limitDate) > 0) {
      dueDate = limitDate
    }

    dates.push(dueDate.toString())
  }

  return dates
}
/**
 * Calcula o preço total baseado na contagem de ocupantes por categoria.
 * Útil para listagem e resumo onde ainda não temos os dados individuais dos hóspedes.
 *
 * @param {Object} room - Objeto do quarto.
 * @param {Object} counts - { adults: number, [policyId]: number }
 * @param {Object} foundCompany - Empresa (opcional).
 * @param {Array} globalDiscounts - Lista de descontos globais.
 * @returns {Object} - Resumo financeiro.
 */
export function calculateSummaryPrice(
  room,
  counts,
  foundCompany,
  globalDiscounts = [],
) {
  if (!room) return { finalTotal: 0, memberTotal: 0, publicTotal: 0 }

  const policies = room.price_policies || []

  // Helper para calcular total com um preço base específico
  const calcTotal = (priceBase) => {
    let total = 0
    const adultPriceBase = Number(priceBase) || 0
    const childPriceBase = Number(publicBase) || 0

    // Adultos
    total += (Number(counts?.adults) || 0) * adultPriceBase

    // Crianças
    if (counts) {
      Object.keys(counts).forEach((key) => {
        if (key === "adults") return
        const count = Number(counts[key]) || 0
        if (count <= 0) return

        const policy = policies.find((p) => p.id === key)
        if (policy) {
          if (policy.use_percentage === false) {
            const policyPrice =
              policy.price != null ? Number(policy.price) : childPriceBase
            total += count * policyPrice
          } else {
            const percentage = Number(policy.percentage ?? 100)
            total += count * childPriceBase * (percentage / 100)
          }
        } else {
          // Se não encontrou a política, trata como adulto
          total += count * childPriceBase
        }
      })
    }
    return total
  }

  const publicBase = Number(room.price_per_night || 0)
  const memberBase = Number(
    room.member_price_per_night || room.price_per_night || 0,
  )

  const publicTotal = calcTotal(publicBase)
  const memberTotal = calcTotal(memberBase)

  // Determinar desconto da empresa atual
  let isAssociate = false
  let discountPercentage = 0

  if (foundCompany) {
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

    if (isAssociate) {
      discountPercentage = 0
    } else if (foundCompany.custom_discount_percentage != null) {
      discountPercentage = Number(foundCompany.custom_discount_percentage)
    } else if (matchingDiscount) {
      discountPercentage = Number(matchingDiscount.value)
    }
  }

  const baseTotal = isAssociate ? memberTotal : publicTotal
  const baseAdultPrice = isAssociate ? memberBase : publicBase
  const baseAdultTotal = (Number(counts?.adults) || 0) * baseAdultPrice

  const discountAmount = calculateAdultDiscount(
    baseAdultTotal,
    discountPercentage,
  )
  const finalTotal = baseTotal - discountAmount

  return {
    originalTotal: publicTotal,
    adultOriginalTotal: (Number(counts?.adults) || 0) * publicBase,
    discountPercentage,
    discountAmount,
    finalTotal,
    isAssociate,
    memberTotal,
    publicTotal,
  }
}

/**
 * Calcula o valor de desconto aplicável apenas sobre a parcela dos adultos.
 *
 * @param {number} adultTotal - Valor total acumulado dos adultos.
 * @param {number} discountPercentage - Porcentagem do desconto (0 a 100).
 * @returns {number} - Valor do desconto calculado.
 */
export function calculateAdultDiscount(adultTotal, discountPercentage) {
  return (Number(adultTotal) || 0) * ((Number(discountPercentage) || 0) / 100)
}

/**
 * Calcula a quantidade total de crianças a partir do objeto de contagem de hóspedes.
 *
 * @param {Object} counts - Objeto contendo { adults: number, [policyId]: number }
 * @returns {number} - Quantidade total de crianças.
 */
export function getChildrenCount(counts) {
  if (!counts) return 0
  return Object.keys(counts)
    .filter((k) => k !== "adults" && k !== "id")
    .reduce((acc, k) => acc + (Number(counts[k]) || 0), 0)
}

/**
 * Calcula o detalhamento completo de preço de uma venda (original, desconto, economizado, final)
 * a partir dos dados persistidos da venda no banco de dados.
 *
 * @param {Object} saleDetails - Dados detalhados da venda vindos do findOneByIdWithDetails.
 * @returns {Object} - Detalhamento financeiro.
 */
export function calculateSalePriceBreakdown(saleDetails) {
  if (!saleDetails) {
    return {
      originalTotal: 0,
      economizedAmount: 0,
      finalTotal: 0,
      discountLabel: "Desconto",
    }
  }

  const checkIn = new Date(saleDetails.check_in_date)
  let adultCount = 0
  if (saleDetails.guests && Array.isArray(saleDetails.guests)) {
    saleDetails.guests.forEach((guest) => {
      if (!guest.birth_date) {
        adultCount++
        return
      }
      const birth = new Date(guest.birth_date)
      let age = checkIn.getUTCFullYear() - birth.getUTCFullYear()
      const m = checkIn.getUTCMonth() - birth.getUTCMonth()
      if (m < 0 || (m === 0 && checkIn.getUTCDate() < birth.getUTCDate())) {
        age--
      }
      if (age >= 12) {
        adultCount++
      }
    })
  }

  const roomPricePerNight = Number(saleDetails.room_price_per_night || 0)
  const roomMemberPricePerNight = Number(
    saleDetails.room_member_price_per_night || roomPricePerNight,
  )

  const isAbravidroAssociate =
    saleDetails.company_discount_name === "Associada" ||
    saleDetails.company_discount_name === "Associado"
  const hasDiscountPercentage = Number(saleDetails.discount_percentage) > 0

  let originalTotal = Number(saleDetails.total_amount || 0)
  let economizedAmount = 0
  let discountLabel = "Desconto"

  if (isAbravidroAssociate) {
    discountLabel = "Desconto associado Abravidro"
    const associateSavings =
      adultCount * (roomPricePerNight - roomMemberPricePerNight)
    const savings = associateSavings > 0 ? associateSavings : 0
    originalTotal = Number(saleDetails.final_amount) + savings
    economizedAmount = savings
  } else if (hasDiscountPercentage) {
    if (saleDetails.company_discount_name) {
      const nameLower = saleDetails.company_discount_name.toLowerCase()
      if (nameLower.includes("abravidro")) {
        discountLabel = `Desconto associado Abravidro`
      } else {
        discountLabel = `Desconto associado de entidade regional`
      }
    } else {
      discountLabel = `Desconto associado de entidade regional`
    }
    originalTotal = Number(saleDetails.total_amount)
    economizedAmount = Number(saleDetails.discount_amount)
  } else {
    originalTotal = Number(saleDetails.final_amount)
    economizedAmount = 0
  }

  return {
    originalTotal,
    economizedAmount,
    finalTotal: Number(saleDetails.final_amount),
    discountLabel,
    isAbravidroAssociate,
    hasDiscountPercentage,
  }
}

export function getGuestCountsString(saleDetails, isInternational = false) {
  if (!saleDetails) return ""
  const checkIn = new Date(saleDetails.check_in_date)
  let adultCount = 0
  const childrenCounts = {}
  const policies = saleDetails.price_policies || []

  if (saleDetails.guests && Array.isArray(saleDetails.guests)) {
    saleDetails.guests.forEach((guest) => {
      if (!guest.birth_date) {
        adultCount++
        return
      }
      const birth = new Date(guest.birth_date)
      let age = checkIn.getUTCFullYear() - birth.getUTCFullYear()
      const m = checkIn.getUTCMonth() - birth.getUTCMonth()
      if (m < 0 || (m === 0 && checkIn.getUTCDate() < birth.getUTCDate())) {
        age--
      }
      if (age >= 12) {
        adultCount++
      } else {
        const matchingPolicy = policies.find((p) => age <= p.max_age)
        if (matchingPolicy) {
          let desc = translateText(matchingPolicy.description, isInternational)
          if (!isInternational) {
            desc = desc
              ?.replace(/Crianças/g, "Criança(s)")
              .replace(/crianças/g, "criança(s)")
          }
          childrenCounts[desc] = (childrenCounts[desc] || 0) + 1
        } else {
          const defaultChildLabel = isInternational ? "Child(ren)" : "Criança(s)"
          childrenCounts[defaultChildLabel] = (childrenCounts[defaultChildLabel] || 0) + 1
        }
      }
    })
  }

  const adultLabel = isInternational ? `${adultCount} adult(s)` : `${adultCount} adulto(s)`
  const guestCountsList = [adultLabel]
  Object.keys(childrenCounts).forEach((desc) => {
    guestCountsList.push(`${childrenCounts[desc]} ${desc}`)
  })
  return guestCountsList.join(", ")
}

/**
 * Traduz textos dinâmicos retornados do banco de dados contendo delimitadores como $en$.
 * Exemplo: "Nome em PT $en$ Name in EN"
 *
 * @param {string} text - O texto que pode conter traduções.
 * @param {boolean} isInternational - Se deve retornar a versão em inglês.
 * @returns {string} - O texto traduzido.
 */
export function translateText(text, isInternational) {
  if (!text) return ""

  if (isInternational && text.includes("$en$")) {
    const afterEn = text.split("$en$")[1]
    const nextTagIndex = afterEn.search(/\$[a-z]{2}\$/)
    if (nextTagIndex !== -1) {
      return afterEn.substring(0, nextTagIndex).trim()
    }
    return afterEn.trim()
  }

  const firstTagIndex = text.search(/\$[a-z]{2}\$/)
  if (firstTagIndex !== -1) {
    return text.substring(0, firstTagIndex).trim()
  }

  return text
}
