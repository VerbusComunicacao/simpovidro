import { createRouter } from "next-connect"
import database from "infra/database.js"
import controller from "infra/controller"
const router = createRouter()

router.get(status)

export default router.handler(controller.errorHandlers)

async function status(request, response) {
  const updatedAt = new Date().toISOString()
  const databaseVersionResult = await database.query(`
    SHOW server_version;
  `)
  const databaseVersionValue = databaseVersionResult.rows[0].server_version

  const maxConnections = await database.query(`
    SELECT current_setting('max_connections');
  `)

  const databaseName = process.env.POSTGRES_DB

  const activeConnections = await database.query({
    text: `
      SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1;
    `,
    values: [databaseName],
  })

  response.status(200).json({
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: databaseVersionValue,
        max_connections: Number(maxConnections.rows[0].current_setting),
        opened_connections: activeConnections.rows[0].count,
      },
    },
  })
}
