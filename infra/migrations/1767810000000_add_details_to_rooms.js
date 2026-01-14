exports.up = (pgm) => {
  pgm.addColumns("rooms", {
    name: {
      type: "text",
      notNull: false,
    },
    description: {
      type: "text",
      notNull: false,
    },
    photos: {
      type: "text[]",
      notNull: false,
      default: "{}",
    },
  })
}
