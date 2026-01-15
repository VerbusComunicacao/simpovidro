import migrationRunner from "node-pg-migrate"
import { resolve } from "node:path"
import database from "infra/database.js"

const defaultMigrationOptions = {
  dir: resolve("infra", "migrations"),
  direction: "up",
  dryRun: true,
  log: () => {},
  migrationsTable: "pgmigrations",
}

async function listPendingMigrations() {
  let dbClient

  try {
    dbClient = await database.getNewClient()

    const pendingMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
      schema:
        process.env.NODE_ENV === "test" || process.env.DATABASE_ENV === "test"
          ? "test"
          : "public",
    })

    return pendingMigrations
  } finally {
    await dbClient?.end()
  }
}

async function runPendingMigrations() {
  let dbClient

  try {
    dbClient = await database.getNewClient()

    const migratedMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
      dryRun: false,
      schema:
        process.env.NODE_ENV === "test" || process.env.DATABASE_ENV === "test"
          ? "test"
          : "public",
    })

    return migratedMigrations
  } finally {
    await dbClient?.end()
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
}

export default migrator
