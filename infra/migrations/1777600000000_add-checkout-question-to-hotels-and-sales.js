exports.shorthands = undefined

exports.up = (pgm) => {
  pgm.addColumn("hotels", {
    checkout_question: {
      type: "text",
      notNull: false,
    },
  })

  pgm.addColumn("sales", {
    checkout_question_response: {
      type: "text",
      notNull: false,
    },
  })
}

exports.down = (pgm) => {
  pgm.dropColumn("hotels", "checkout_question")
  pgm.dropColumn("sales", "checkout_question_response")
}
