import { Temporal } from "@js-temporal/polyfill"
import database from "infra/database.js"
import { NotFoundError } from "infra/errors.js"
import { validateUUID } from "infra/validator.js"

async function findAll({ sale_id, status } = {}) {
  let queryText = `SELECT * FROM sale_installments`
  const queryValues = []

  const filters = []
  if (sale_id) {
    validateUUID(sale_id)
    filters.push(`sale_id = $${queryValues.length + 1}`)
    queryValues.push(sale_id)
  }

  if (status) {
    filters.push(`status = $${queryValues.length + 1}`)
    queryValues.push(status)
  }

  if (filters.length > 0) {
    queryText += ` WHERE ` + filters.join(" AND ")
  }

  queryText += ` ORDER BY installment_number ASC`

  const results = await database.query({
    text: queryText,
    values: queryValues,
  })

  return results.rows
}

async function findOneById(installmentId) {
  validateUUID(installmentId)
  const results = await database.query({
    text: `SELECT * FROM sale_installments WHERE id = $1 LIMIT 1;`,
    values: [installmentId],
  })

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "A parcela informada não foi encontrada.",
      action: "Verifique o ID da parcela.",
    })
  }

  return results.rows[0]
}

async function update(installmentId, installmentInputNewValues) {
  validateUUID(installmentId)

  const currentInstallment = await findOneById(installmentId)

  const installmentWithNewValues = {
    ...currentInstallment,
    ...installmentInputNewValues,
  }

  const { status, paid_amount, payment_date, notes } = installmentWithNewValues

  const results = await database.query({
    text: `
      UPDATE sale_installments
      SET 
        status = $2,
        paid_amount = $3,
        payment_date = $4,
        notes = $5,
        updated_at = timezone('utc', now())
      WHERE id = $1
      RETURNING *;
    `,
    values: [installmentId, status, paid_amount, payment_date, notes],
  })

  return results.rows[0]
}

async function getOpenBalance(saleId) {
  validateUUID(saleId)
  const results = await database.query({
    text: `
      SELECT SUM(amount - paid_amount) as open_balance
      FROM sale_installments
      WHERE sale_id = $1 AND status IN ('pending', 'overdue');
    `,
    values: [saleId],
  })

  return Number(results.rows[0].open_balance || 0)
}

async function findOverdue() {
  const results = await database.query({
    text: `
      SELECT * FROM sale_installments
      WHERE status = 'pending' AND due_date < CURRENT_DATE
      ORDER BY due_date ASC;
    `,
  })

  return results.rows
}

async function createMany(installments, client) {
  const db = client || database

  for (const installment of installments) {
    const { sale_id, installment_number, amount, due_date } = installment
    await db.query({
      text: `
        INSERT INTO sale_installments (sale_id, installment_number, amount, due_date)
        VALUES ($1, $2, $3, $4)
      `,
      values: [sale_id, installment_number, amount, due_date],
    })
  }
}

function generateInstallmentDates(count, eventDate) {
  const dates = []
  const today = Temporal.Now.plainDateISO()

  if (count <= 1) {
    // Only one installment: 5 days after registration
    // We don't cap it to 5 days before the event here because validation should happen elsewhere
    // but typically a sale wouldn't be allowed if it's too close to the event.
    dates.push(today.add({ days: 5 }).toString())
    return dates
  }

  // First installment: 5 days after registration
  dates.push(today.add({ days: 5 }).toString())

  // Intermediate installments: end of each month starting from the month AFTER today
  // until we reach the month before the last installment.
  // Number of intermediates to add = count - 2
  for (let i = 1; i < count - 1; i++) {
    const monthDate = today.add({ months: i })
    const lastDay = monthDate.with({ day: monthDate.daysInMonth })
    dates.push(lastDay.toString())
  }

  // Last installment: 5 days before the event
  dates.push(eventDate.subtract({ days: 5 }).toString())

  return dates
}

const saleInstallment = {
  findAll,
  findOneById,
  update,
  getOpenBalance,
  findOverdue,
  createMany,
  generateInstallmentDates,
}

export default saleInstallment
