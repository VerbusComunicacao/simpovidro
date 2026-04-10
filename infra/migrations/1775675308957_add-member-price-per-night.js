exports.up = (pgm) => {
  pgm.addColumns("rooms", {
    member_price_per_night: {
      type: "numeric(10,2)",
      notNull: true,
      default: 0,
    },
  })
}

exports.down = false
