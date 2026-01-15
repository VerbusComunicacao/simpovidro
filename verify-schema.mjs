import database from "./infra/database.js"
import dotenv from "dotenv"
dotenv.config({ path: ".env.development" })

async function verifySchema() {
  console.log("Connecting to database...")
  try {
    const res = await database.query("SHOW search_path;")
    console.log("Current search_path:", res.rows[0].search_path)

    if (res.rows[0].search_path === "test, public") {
      console.log("SUCCESS: Schema is correctly set to 'test'.")
    } else {
      console.error("FAILURE: Schema is NOT set to 'test'.")
      console.error("Got:", res.rows[0].search_path)
      process.exit(1)
    }
  } catch (err) {
    console.error("Error:", err)
    process.exit(1)
  }
}

verifySchema()
