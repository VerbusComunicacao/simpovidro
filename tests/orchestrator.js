import database from "infra/database"
import migrator from "models/migrator.js"
import user from "models/user.js"
import retry from "async-retry"
import { faker } from "@faker-js/faker"
import session from "models/session.js"
import hotel from "models/hotel.js"
import roomType from "models/room-type.js"
import roomCategory from "models/room-category.js"
import room from "models/room.js"
import activation from "models/activation"
import discount from "models/discount"
import registration from "models/registration.js"
import guest from "models/guest.js"

const emailHttpUrl = `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}`
const webserverUrl = "http://localhost:3000"

async function waitForAllServices() {
  await waitForWebServer()
  await waitForEmailServer()

  async function waitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    })

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status")
      if (response.status !== 200) {
        throw Error()
      }
    }
  }

  async function waitForEmailServer() {
    return retry(fetchEmailPage, {
      retries: 100,
      maxTimeout: 1000,
    })

    async function fetchEmailPage() {
      const response = await fetch(emailHttpUrl)
      if (response.status !== 200) {
        throw Error()
      }
    }
  }
}

async function clearDatabase() {
  if (process.env.NODE_ENV === "test" || process.env.DATABASE_ENV === "test") {
    await database.query(
      "drop schema if exists test cascade; create schema test;",
    )
  } else {
    await database.query("drop schema public cascade; create schema public;")
  }
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations()
}

async function createUser(userObject) {
  return await user.create({
    full_name: userObject?.full_name || faker.person.fullName(),
    email: userObject?.email || faker.internet.email(),
    password: userObject?.password || "validPassword",
  })
}

async function deleteAllEmails() {
  await fetch(`${emailHttpUrl}/messages`, { method: "DELETE" })
}

async function createHotel(userId, hotelData) {
  return await hotel.create(
    {
      name: hotelData?.name || faker.company.name(),
      city: hotelData?.city || faker.location.city(),
      country: hotelData?.country || faker.location.country(),
      email: hotelData?.email || faker.internet.email(),
      phone: hotelData?.phone || faker.internet.phone,
      address: hotelData?.address || faker.location.streetAddress(),
      state: hotelData?.state || faker.location.state(),
      check_in_date: hotelData?.check_in_date || new Date().toISOString(),
      check_out_date:
        hotelData?.check_out_date ||
        new Date(Date.now() + 86400000 * 3).toISOString(),
      price_policies: hotelData?.price_policies || [],
    },
    userId,
  )
}

async function createRoomCategory(userId, roomCategoryData) {
  return await roomCategory.create(
    {
      name: roomCategoryData?.name || faker.commerce.productName(),
      max_adults:
        roomCategoryData?.max_adults ?? faker.number.int({ min: 1, max: 4 }),
      max_children:
        roomCategoryData?.max_children ?? faker.number.int({ min: 0, max: 3 }),
    },
    userId,
  )
}

async function createRoom(userId, roomData) {
  return await room.create(
    {
      hotel_id: roomData?.hotel_id || (await createHotel(userId)).id,
      room_type_id: roomData?.room_type_id || (await createRoomType(userId)).id,
      room_category_id:
        roomData?.room_category_id || (await createRoomCategory(userId)).id,
      price_per_night:
        roomData?.price_per_night ||
        faker.number.float({ min: 50, max: 500, fractionDigits: 2 }),
      total_rooms:
        roomData?.total_rooms ?? faker.number.int({ min: 1, max: 10 }),
      available_rooms:
        roomData?.available_rooms ?? faker.number.int({ min: 1, max: 5 }),
      blocked_rooms:
        roomData?.blocked_rooms ?? faker.number.int({ min: 0, max: 3 }),
    },
    userId,
  )
}

async function createRoomType(userId, roomTypeData) {
  return await roomType.create(
    {
      name: roomTypeData?.name || faker.commerce.productName(),
      description:
        roomTypeData?.description || faker.commerce.productDescription(),
    },
    userId,
  )
}

async function getLastEmail() {
  const emailListResponse = await fetch(`${emailHttpUrl}/messages`)
  const emailListBody = await emailListResponse.json()
  const lastEmailItem = emailListBody.pop()

  if (!lastEmailItem) {
    return null
  }

  const emailTextResponse = await fetch(
    `${emailHttpUrl}/messages/${lastEmailItem.id}.plain`,
  )
  const emailTextBody = await emailTextResponse.text()
  lastEmailItem.text = emailTextBody
  return lastEmailItem
}

async function createSession(userId) {
  return await session.create(userId)
}

async function activateUser(userId) {
  const token = await activation.generateToken(userId)
  await activation.activateAccount(token)
}

async function activateAdmUser(userId) {
  const token = await activation.generateToken(userId)
  await activation.activateAdmAccount(token)
}

async function setUserFeatures(userId, features) {
  await user.setFeatures(userId, features)
}

async function addFeatureToUser(userObject, features) {
  const updatedUser = await user.addFeatures(userObject.id, features)
  return updatedUser
}

async function activateHotel(hotelId) {
  await hotel.activate(hotelId)
}

async function injectPasswordRecoveryToken(tokenObject) {
  await database.query({
    text: "INSERT INTO password_recovery_tokens (token, user_id, expires_at, used_at) VALUES ($1, $2, $3, $4)",
    values: [
      tokenObject.token,
      tokenObject.user_id,
      tokenObject.expires_at || new Date(Date.now() + 100000),
      tokenObject.used_at || null,
    ],
  })
}

async function createDiscount(discountData) {
  return await discount.create({
    name: discountData?.name || faker.commerce.productName(),
    value:
      discountData?.value ??
      faker.number.float({ min: 5, max: 50, fractionDigits: 2 }),
  })
}

async function createRegistration(userId, registrationData) {
  const userResults = await database.query({
    text: "SELECT email, full_name FROM users WHERE id = $1",
    values: [userId],
  })
  const userProfile = userResults.rows[0] || {
    email: faker.internet.email(),
    full_name: faker.person.fullName(),
  }

  const data = {
    room_id: registrationData?.room_id || (await createRoom(userId)).id,
    guests_data: registrationData?.guests_data || [
      {
        name: userProfile.full_name,
        email: userProfile.email,
        phone: faker.string.numeric(11),
        gender: faker.helpers.arrayElement(["Masculino", "Feminino"]),
        rg_number: faker.string.numeric(9),
        cpf_number: faker.string.numeric(11),
        birth_date: faker.date
          .birthdate({ min: 18, max: 80, mode: "age" })
          .toISOString()
          .split("T")[0],
      },
    ],
    company_cnpj: registrationData?.company_cnpj || null,
    payment_method: registrationData?.payment_method || "installments",
    installments_count: registrationData?.installments_count || 3,
  }
  return await registration.create(userId, data)
}

async function createGuest(guestData, userId, client) {
  return await guest.upsert(guestData, userId, client)
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
  createSession,
  deleteAllEmails,
  getLastEmail,
  createHotel,
  createRoomType,
  createRoomCategory,
  createRoom,
  activateUser,
  activateAdmUser,
  setUserFeatures,
  activateHotel,
  injectPasswordRecoveryToken,
  addFeatureToUser,
  createDiscount,
  createRegistration,
  createGuest,

  createPricePolicy,
  webserverUrl,
}

async function createPricePolicy(hotelId, policyData) {
  return await database.query({
    text: `
      INSERT INTO price_policies (hotel_id, max_age, percentage, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    values: [
      hotelId,
      policyData.max_age,
      policyData.percentage,
      policyData.description,
    ],
  })
}

export default orchestrator
