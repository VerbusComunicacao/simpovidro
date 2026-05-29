exports.up = (pgm) => {
  pgm.addColumn("sales", {
    user_id: {
      type: "uuid",
      notNull: false,
    },
  })
}

exports.down = (pgm) => {
  pgm.dropColumn("sales", "user_id")
}
