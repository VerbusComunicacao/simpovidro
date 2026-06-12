/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.alterColumn("guests", "cpf_number", {
    notNull: false,
  })
  pgm.alterColumn("guests", "rg_number", {
    notNull: false,
  })
}

exports.down = (pgm) => {
  pgm.alterColumn("guests", "cpf_number", {
    notNull: true,
  })
  pgm.alterColumn("guests", "rg_number", {
    notNull: true,
  })
}
