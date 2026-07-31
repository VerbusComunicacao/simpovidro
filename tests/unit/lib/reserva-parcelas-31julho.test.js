import {
  calculateMaxInstallments,
  generateInstallmentDates,
} from "../../../lib/registration-helpers.js"

jest.useFakeTimers()

describe("Teste de Reserva e Parcelamento - Validação Completa de Datas", () => {
  const hotelEntryDate = "2026-11-05" // Evento do Simpovidro (05 a 08 de Novembro de 2026)
  // Regra mestre: Limite máximo para vencimento da última parcela é 6 dias antes do evento (30/10/2026)

  afterAll(() => {
    jest.useRealTimers()
  })

  test("Inscrição em 30/07/2026 deve permitir 4 parcelas", () => {
    jest.setSystemTime(new Date("2026-07-30T12:00:00Z"))

    const max = calculateMaxInstallments(hotelEntryDate)
    const dates = generateInstallmentDates(max, hotelEntryDate)

    expect(max).toBe(4)
    expect(dates).toEqual([
      "2026-08-04",
      "2026-08-30",
      "2026-09-30",
      "2026-10-30",
    ])
  })

  test("Inscrição em 31/07/2026 (Hoje) deve permitir 4 parcelas (05/08, 31/08, 30/09 e 30/10)", () => {
    jest.setSystemTime(new Date("2026-07-31T12:00:00Z"))

    const max = calculateMaxInstallments(hotelEntryDate)
    const dates = generateInstallmentDates(max, hotelEntryDate)

    console.log("--------------------------------------------------")
    console.log("Data da Inscrição (Hoje): 31/07/2026")
    console.log("Data de Entrada no Hotel: 05/11/2026")
    console.log("Quantidade de Parcelas Calculada:", max)
    console.log("Datas de Vencimento das Parcelas:", dates)
    console.log("--------------------------------------------------")

    expect(max).toBe(4)
    expect(dates).toEqual([
      "2026-08-05",
      "2026-08-31",
      "2026-09-30",
      "2026-10-30",
    ])
  })

  test("Inscrição em 01/08/2026 deve permitir 3 parcelas", () => {
    jest.setSystemTime(new Date("2026-08-01T12:00:00Z"))

    const max = calculateMaxInstallments(hotelEntryDate)
    const dates = generateInstallmentDates(max, hotelEntryDate)

    expect(max).toBe(3)
    expect(dates).toEqual(["2026-08-06", "2026-09-01", "2026-10-01"])
  })

  test("Inscrição em 31/08/2026 deve permitir 3 parcelas", () => {
    jest.setSystemTime(new Date("2026-08-31T12:00:00Z"))

    const max = calculateMaxInstallments(hotelEntryDate)
    const dates = generateInstallmentDates(max, hotelEntryDate)

    expect(max).toBe(3)
    expect(dates).toEqual(["2026-09-05", "2026-09-30", "2026-10-30"])
  })

  test("Inscrição em 26/09/2026 deve permitir 2 parcelas (01/10 e 26/10)", () => {
    jest.setSystemTime(new Date("2026-09-26T12:00:00Z"))

    const max = calculateMaxInstallments(hotelEntryDate)
    const dates = generateInstallmentDates(max, hotelEntryDate)

    expect(max).toBe(2)
    expect(dates).toEqual(["2026-10-01", "2026-10-26"])
  })

  test("Inscrição em 30/09/2026 deve permitir 2 parcelas (05/10 e 30/10)", () => {
    jest.setSystemTime(new Date("2026-09-30T12:00:00Z"))

    const max = calculateMaxInstallments(hotelEntryDate)
    const dates = generateInstallmentDates(max, hotelEntryDate)

    expect(max).toBe(2)
    expect(dates).toEqual(["2026-10-05", "2026-10-30"])
  })

  test("Inscrição em 01/10/2026 deve permitir apenas 1 parcela (06/10)", () => {
    jest.setSystemTime(new Date("2026-10-01T12:00:00Z"))

    const max = calculateMaxInstallments(hotelEntryDate)
    const dates = generateInstallmentDates(max, hotelEntryDate)

    expect(max).toBe(1)
    expect(dates).toEqual(["2026-10-06"])
  })

  test("Inscrição em 29/10/2026 deve permitir apenas 1 parcela travada no limite (30/10)", () => {
    jest.setSystemTime(new Date("2026-10-29T12:00:00Z"))

    const max = calculateMaxInstallments(hotelEntryDate)
    const dates = generateInstallmentDates(max, hotelEntryDate)

    expect(max).toBe(1)
    expect(dates).toEqual(["2026-10-30"])
  })

  test("Inscrição em 30/10/2026 (data limite) deve permitir 1 parcela", () => {
    jest.setSystemTime(new Date("2026-10-30T12:00:00Z"))

    const max = calculateMaxInstallments(hotelEntryDate)
    const dates = generateInstallmentDates(max, hotelEntryDate)

    expect(max).toBe(1)
    expect(dates).toEqual(["2026-10-30"])
  })
})
