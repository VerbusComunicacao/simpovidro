import database from "infra/database"
import { ValidationError, NotFoundError } from "infra/errors.js"
import password from "models/password.js"

async function create(userInputValues) {
  await validateUniqueEmail(userInputValues.email)
  await validateUniqueUsername(userInputValues.username)
  await hashPasswordInObject(userInputValues)
  injectDefaultFeatureInObject(userInputValues)

  const newUser = await runInsertQuery(userInputValues)
  return newUser

  async function hashPasswordInObject(userInputValues) {
    const hashedPassword = await password.hash(userInputValues.password)
    userInputValues.password = hashedPassword
  }

  async function runInsertQuery(userInputValues) {
    const { username, email, password, features } = userInputValues

    const results = await database.query({
      text: `
    INSERT INTO 
        users (username, email, password, features)
    VALUES 
        ($1, $2, $3, $4)
    RETURNING
        *
    ;`,
      values: [username, email, password, features],
    })

    return results.rows[0]
  }

  async function injectDefaultFeatureInObject(userInputValues) {
    userInputValues.features = ["read:activation_token"]
  }
}

async function findOneById(userId) {
  const userFound = await runSelectQuery(userId)
  return userFound

  async function runSelectQuery(userId) {
    const results = await database.query({
      text: `
      SELECT 
        * 
      FROM 
        users
      WHERE 
        id = $1
      LIMIT
        1
      ;`,

      values: [userId],
    })

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O ID informado não foi encontrado no sistema.",
        action: "Verifique se o ID está digitado corretamente.",
      })
    }

    return results.rows[0]
  }
}

async function findOneByUsername(username) {
  const userFound = await runSelectQuery(username)
  return userFound

  async function runSelectQuery(username) {
    const results = await database.query({
      text: `
      SELECT 
        * 
      FROM 
        users
      WHERE 
        LOWER(username) = LOWER($1)
      LIMIT
        1
      ;`,

      values: [username],
    })

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique se o username está digitado corretamente.",
      })
    }

    return results.rows[0]
  }
}

async function findOneByEmail(email) {
  const userFound = await runSelectQuery(email)
  return userFound

  async function runSelectQuery(email) {
    const results = await database.query({
      text: `
      SELECT 
        * 
      FROM 
        users
      WHERE 
        LOWER(email) = LOWER($1)
      LIMIT
        1
      ;`,

      values: [email],
    })

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O Email informado não foi encontrado no sistema.",
        action: "Verifique se o email está digitado corretamente.",
      })
    }

    return results.rows[0]
  }
}

async function update(username, userInputNewValues) {
  const currentUser = await findOneByUsername(username)

  if ("email" in userInputNewValues) {
    await validateUniqueEmail(userInputNewValues.email)
  }

  if ("username" in userInputNewValues) {
    const isUsernameUnchanged =
      username.toLowerCase() === userInputNewValues.username.toLowerCase()

    if (!isUsernameUnchanged) {
      await validateUniqueUsername(userInputNewValues.username)
    }
  }

  if ("password" in userInputNewValues) {
    await hashPasswordInObject(userInputNewValues)
  }

  const userWithNewValues = { ...currentUser, ...userInputNewValues }

  const updatedUser = await runUpdateQuery(userWithNewValues)
  return updatedUser

  async function runUpdateQuery(userWithNewValues) {
    const results = await database.query({
      text: `
     UPDATE
      users
    SET 
    username = $2,
    email = $3,
    password = $4,
    updated_at = timezone('utc', now())
     WHERE
      id = $1
    RETURNING
      *
      `,
      values: [
        userWithNewValues.id,
        userWithNewValues.username,
        userWithNewValues.email,
        userWithNewValues.password,
      ],
    })

    return results.rows[0]
  }
}

async function setFeatures(userId, features) {
  await database.query({
    text: `
    UPDATE
      users
    SET
      features = $2
    WHERE
      id = $1
    ;`,
    values: [userId, features],
  })
}

async function validateUniqueEmail(email) {
  const results = await database.query({
    text: `
    SELECT 
      email
    FROM
      users
    WHERE
      LOWER(email) = LOWER($1)
    ;`,
    values: [email],
  })

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O email informado já está sendo utilizado.",
      action: "Utilize outro email para realizar esta operação.",
    })
  }
}

async function validateUniqueUsername(username) {
  const results = await database.query({
    text: `
    SELECT 
      username
    FROM
      users
    WHERE
      LOWER(username) = LOWER($1)
    ;`,
    values: [username],
  })

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O username informado já está sendo utilizado.",
      action: "Utilize outro username para realizar esta operação.",
    })
  }
}

async function hashPasswordInObject(userInputNewValues) {
  const passwordHashed = await password.hash(userInputNewValues.password)
  userInputNewValues.password = passwordHashed
}

const user = {
  create,
  findOneById,
  findOneByUsername,
  findOneByEmail,
  update,
  setFeatures,
}

export default user
