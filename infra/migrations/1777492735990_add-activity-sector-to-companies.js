exports.up = (pgm) => {
  pgm.addColumn("companies", {
    activity_sector: {
      type: "varchar(200)",
      notNull: false,
    },
  })
}

exports.down = (pgm) => {
  pgm.dropColumn("companies", "activity_sector")
}
