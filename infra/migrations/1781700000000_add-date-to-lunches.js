exports.shorthands = undefined

exports.up = (pgm) => {
  pgm.addColumns("lunches", {
    lunch_date: {
      type: "date",
      notNull: false,
    },
    lunch_time: {
      type: "time",
      notNull: false,
    },
  })
}

exports.down = (pgm) => {
  pgm.dropColumns("lunches", ["lunch_date", "lunch_time"])
}
