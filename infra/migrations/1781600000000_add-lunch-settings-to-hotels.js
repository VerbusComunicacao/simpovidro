exports.shorthands = undefined

exports.up = (pgm) => {
  pgm.addColumns("hotels", {
    allow_multiple_lunches: {
      type: "boolean",
      notNull: true,
      default: true,
    },
    max_lunches_per_guest: {
      type: "integer",
      notNull: false,
      default: null,
    },
  })
}

exports.down = (pgm) => {
  pgm.dropColumns("hotels", ["allow_multiple_lunches", "max_lunches_per_guest"])
}
