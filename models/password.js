import bcryptjs from "bcryptjs"

const ROUNDS = process.env.NODE_ENV === "production" ? 14 : 1

async function hash(password) {
  return await bcryptjs.hash(password, ROUNDS)
}

async function compare(providedPassword, storedPassword) {
  return await bcryptjs.compare(providedPassword, storedPassword)
}

const password = {
  hash,
  compare,
}

export default password
