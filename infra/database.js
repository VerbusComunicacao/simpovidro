import { Client, types } from "pg"

// Force DATE (OID 1082) to be returned as string to avoid timezone shifts
// https://github.com/brianc/node-pg-types
types.setTypeParser(1082, (val) => val)
import { ServiceError } from "./errors.js"

async function query(queryObject) {
  let client
  try {
    client = await getNewClient()
    const result = await client.query(queryObject)
    return result
  } catch (error) {
    const serviceErrorObject = new ServiceError({
      message: "Erro na conexão com o Banco ou na Query.",
      cause: error,
    })
    throw serviceErrorObject
  } finally {
    await client?.end()
  }
}

async function getNewClient() {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl: getSSLValues(),
  })

  await client.connect()
  return client
}

const database = {
  query,
  getNewClient,
}

export default database

function getSSLValues() {
  if (process.env.POSTGRES_CA) {
    return {
      ca: process.env.POSTGRES_CA,
    }
  }
  return process.env.NODE_ENV === "production" ? true : false
}
