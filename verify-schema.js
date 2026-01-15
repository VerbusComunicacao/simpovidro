const database = require("./infra/database.js")

async function verifySchema() {
  console.log("Connecting to database...")
  try {
    // NODE_ENV is set to 'test' when running this script via command line or here
    const client = await database.default.getNewClient()
    console.log("Connected.")

    const res = await client.query("SHOW search_path;")
    console.log("Current search_path:", res.rows[0].search_path)

    if (res.rows[0].search_path === "test, public") {
      console.log("SUCCESS: Schema is correctly set to 'test'.")
    } else {
      console.error("FAILURE: Schema is NOT set to 'test'.")
      process.exit(1)
    }

    await client.end()
  } catch (err) {
    console.error("Error:", err)
    process.exit(1)
  }
}

verifySchema()
