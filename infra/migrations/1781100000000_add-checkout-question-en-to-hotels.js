exports.shorthands = undefined

exports.up = (pgm) => {
  pgm.addColumn("hotels", {
    checkout_question_en: {
      type: "text",
      notNull: false,
    },
  })
}

exports.down = (pgm) => {
  pgm.dropColumn("hotels", "checkout_question_en")
}
