import database from "infra/database.js"

async function create(churchInputValues, userId) {
  const results = await database.query({
    text: `
    INSERT INTO
        churchs (name, user_id)
    VALUES
        ($1, $2)
    RETURNING
        *
    `,
    values: [churchInputValues.name, userId],
  })

  const createdChurch = results.rows[0]

  return createdChurch
}

async function getAllByUserId(userId, page = 1, limit = 10) {
  const offset = (page - 1) * limit

  const results = await database.query({
    text: `
    SELECT
        *
    FROM
      churchs
    WHERE
      user_id = $1
    ORDER BY
      created_at DESC
    LIMIT $2
    OFFSET $3
    `,
    values: [userId, limit, offset],
  })

  const createdChurch = results.rows

  return createdChurch
}

async function getById(churchId) {
  const results = await database.query({
    text: `
    SELECT
        *
    FROM
      churchs
    WHERE
      id = $1
    `,
    values: [churchId],
  })

  const churchResponse = results.rows[0]

  return churchResponse
}

const church = { create, getAllByUserId, getById }
export default church
