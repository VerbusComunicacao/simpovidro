import database from "infra/database.js"
import { ValidationError, NotFoundError } from "infra/errors.js"
import { validateUUID } from "infra/validator.js"
import defaultColors from "lib/colors.js"

async function findOneByUserId(userId) {
  validateUUID(userId)

  const results = await database.query({
    text: `
      SELECT
        *
      FROM
        theme_settings
      WHERE
        user_id = $1
      LIMIT
        1
    `,
    values: [userId],
  })

  if (results.rowCount === 0) {
    // Retorna cores padrão se não houver configuração
    return {
      id: null,
      user_id: userId,
      colors: defaultColors,
      created_at: null,
      updated_at: null,
    }
  }

  // Mescla cores padrão com cores personalizadas
  // PostgreSQL retorna JSONB como objeto, mas pode vir como string em alguns casos
  let customColors = results.rows[0].colors || {}
  if (typeof customColors === "string") {
    try {
      customColors = JSON.parse(customColors)
    } catch (e) {
      customColors = {}
    }
  }
  const mergedColors = deepMerge(defaultColors, customColors)

  return {
    ...results.rows[0],
    colors: mergedColors,
  }
}

async function createOrUpdate(userId, colors) {
  validateUUID(userId)

  if (!colors || typeof colors !== "object") {
    throw new ValidationError({
      message: "Cores inválidas.",
      action: "Envie um objeto válido com as cores.",
    })
  }

  // Verifica se já existe configuração
  const existing = await database.query({
    text: `
      SELECT id
      FROM theme_settings
      WHERE user_id = $1
      LIMIT 1
    `,
    values: [userId],
  })

  if (existing.rowCount > 0) {
    // Atualiza
    const results = await database.query({
      text: `
        UPDATE theme_settings
        SET
          colors = $2,
          updated_at = timezone('utc', now())
        WHERE
          user_id = $1
        RETURNING
          *
      `,
      values: [userId, colors],
    })

    // PostgreSQL com pg.js já faz parse do JSONB automaticamente
    let customColors = results.rows[0].colors || {}
    if (typeof customColors === "string") {
      try {
        customColors = JSON.parse(customColors)
      } catch (e) {
        customColors = {}
      }
    }
    const mergedColors = deepMerge(defaultColors, customColors)

    return {
      ...results.rows[0],
      colors: mergedColors,
    }
  } else {
    // Cria
    // PostgreSQL aceita objeto JavaScript diretamente para JSONB
    const results = await database.query({
      text: `
        INSERT INTO theme_settings
          (user_id, colors)
        VALUES
          ($1, $2)
        RETURNING
          *
      `,
      values: [userId, colors],
    })

    let customColors = results.rows[0].colors || {}
    if (typeof customColors === "string") {
      try {
        customColors = JSON.parse(customColors)
      } catch (e) {
        customColors = {}
      }
    }
    const mergedColors = deepMerge(defaultColors, customColors)

    return {
      ...results.rows[0],
      colors: mergedColors,
    }
  }
}

async function resetToDefault(userId) {
  validateUUID(userId)

  await database.query({
    text: `
      DELETE FROM theme_settings
      WHERE user_id = $1
    `,
    values: [userId],
  })

  return {
    id: null,
    user_id: userId,
    colors: defaultColors,
    created_at: null,
    updated_at: null,
  }
}

function deepMerge(defaultObj, customObj) {
  const result = { ...defaultObj }

  for (const key in customObj) {
    if (customObj[key] && typeof customObj[key] === "object" && !Array.isArray(customObj[key])) {
      result[key] = deepMerge(result[key] || {}, customObj[key])
    } else {
      result[key] = customObj[key]
    }
  }

  return result
}

const theme = {
  findOneByUserId,
  createOrUpdate,
  resetToDefault,
}

export default theme

