import database from "./infra/database.js"
async function check() {
  const res = await database.query({
    text: `
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'guests'::regclass
        AND contype = 'u';
    `,
  })
  console.log(res.rows)
}
check()
  .catch(console.error)
  .finally(() => process.exit())
