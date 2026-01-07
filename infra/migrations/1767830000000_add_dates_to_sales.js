exports.up = (pgm) => {
  pgm.addColumns("sales", {
    check_in_date: {
      type: "timestamptz",
    },
    check_out_date: {
      type: "timestamptz",
    },
  })
}

exports.down = (pgm) => {
  pgm.dropColumns("sales", ["check_in_date", "check_out_date"])
}
