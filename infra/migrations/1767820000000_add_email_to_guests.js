exports.up = (pgm) => {
  pgm.addColumn("guests", {
    email: {
      type: "varchar(254)",
    },
  })
}

exports.down = (pgm) => {
  pgm.dropColumn("guests", "email")
}
