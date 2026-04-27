exports.up = (pgm) => {
  pgm.alterColumn("guests", "phone", {
    notNull: false,
  })
}

exports.down = (pgm) => {
  pgm.alterColumn("guests", "phone", {
    notNull: true,
  })
}
