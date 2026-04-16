exports.up = (pgm) => {
  pgm.addColumn("rooms", {
    min_guests: {
      type: "integer",
      notNull: true,
      default: 1,
    },
  })
}
