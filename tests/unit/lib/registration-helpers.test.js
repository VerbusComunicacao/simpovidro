import {
  calculateMaxInstallments,
  generateInstallmentDates,
  isBoletoAvailable,
  generatePixDueDate,
  PIX_DUE_DAYS,
} from "../../../lib/registration-helpers.js"

// Ativa fake timers para congelar o sistema em datas específicas
jest.useFakeTimers()

describe("registration-helpers.js - Casos de Teste (Hotel 05/11)", () => {
  const hotelEntryDate = "2026-11-05"

  // Regra mestre: Limite é 05/11 - 6 dias = 30/10

  test("Inscrição em 26/09 deve permitir 2 parcelas (01/10 e 26/10)", () => {
    // Congela o tempo em 26/09
    jest.setSystemTime(new Date("2026-09-26T12:00:00Z"))

    expect(calculateMaxInstallments(hotelEntryDate)).toBe(2)

    const dates = generateInstallmentDates(2, hotelEntryDate)
    expect(dates[0]).toBe("2026-10-01") // +5 dias (set tem 30 dias)
    expect(dates[1]).toBe("2026-10-26") // Mesmo dia da inscrição
  })

  test("Inscrição em 30/09 deve permitir 2 parcelas (05/10 e 30/10)", () => {
    jest.setSystemTime(new Date("2026-09-30T12:00:00Z"))

    expect(calculateMaxInstallments(hotelEntryDate)).toBe(2)

    const dates = generateInstallmentDates(2, hotelEntryDate)
    expect(dates[0]).toBe("2026-10-05") // +5 dias
    expect(dates[1]).toBe("2026-10-30") // Mesmo dia da inscrição (limite)
  })

  test("Inscrição em 01/10 deve permitir apenas 1 parcela (06/10)", () => {
    jest.setSystemTime(new Date("2026-10-01T12:00:00Z"))

    expect(calculateMaxInstallments(hotelEntryDate)).toBe(1)

    const dates = generateInstallmentDates(1, hotelEntryDate)
    expect(dates[0]).toBe("2026-10-06") // +5 dias
  })

  test("Inscrição em 30/10 deve permitir apenas 1 parcela travada no limite (30/10)", () => {
    jest.setSystemTime(new Date("2026-10-29T12:00:00Z"))

    expect(calculateMaxInstallments(hotelEntryDate)).toBe(1)

    const dates = generateInstallmentDates(1, hotelEntryDate)
    expect(dates[0]).toBe("2026-10-30") // Hoje+5 seria 03/11, trava em 30/10
  })
})

describe("registration-helpers.js - Boleto x Pix (Hotel 05/11)", () => {
  const hotelEntryDate = "2026-11-05"

  // Limite do boleto: 05/11 - 6 dias = 30/10

  test("29/10 ainda permite boleto", () => {
    jest.setSystemTime(new Date("2026-10-29T12:00:00Z"))

    expect(isBoletoAvailable(hotelEntryDate)).toBe(true)
  })

  test("30/10 (dia limite) já não permite boleto", () => {
    jest.setSystemTime(new Date("2026-10-30T12:00:00Z"))

    expect(isBoletoAvailable(hotelEntryDate)).toBe(false)
  })

  test("depois do limite não permite boleto", () => {
    jest.setSystemTime(new Date("2026-11-02T12:00:00Z"))

    expect(isBoletoAvailable(hotelEntryDate)).toBe(false)
  })

  test("aceita Date além de string", () => {
    jest.setSystemTime(new Date("2026-11-02T12:00:00Z"))

    expect(isBoletoAvailable(new Date("2026-11-05T00:00:00Z"))).toBe(false)
  })

  test("sem data de check-in mantém boleto disponível", () => {
    expect(isBoletoAvailable(null)).toBe(true)
  })

  test("Pix vence no dia da inscrição por padrão (pagamento imediato)", () => {
    jest.setSystemTime(new Date("2026-11-02T12:00:00Z"))

    expect(PIX_DUE_DAYS).toBe(0)
    expect(generatePixDueDate()).toBe("2026-11-02")
  })
})
