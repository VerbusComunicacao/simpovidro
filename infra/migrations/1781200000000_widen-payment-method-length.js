exports.up = (pgm) => {
  pgm.alterColumn("sales", "payment_method", {
    type: "varchar(50)",
  })
}

exports.down = (pgm) => {
  pgm.alterColumn("sales", "payment_method", {
    type: "varchar(20)",
  })
}
