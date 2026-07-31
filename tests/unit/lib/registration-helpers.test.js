import {
  calculateMaxInstallments,
  generateInstallmentDates,
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
