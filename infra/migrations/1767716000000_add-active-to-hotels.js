exports.up = (pgm) => {
  pgm.addColumn("hotels", {
    active: {
      type: "boolean",
      notNull: true,
      default: false,
    },
  })

  pgm.createIndex("hotels", "active", { where: "active = true" })
}
