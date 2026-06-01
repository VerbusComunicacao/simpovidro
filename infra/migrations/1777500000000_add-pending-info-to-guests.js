exports.up = (pgm) => {
  pgm.addColumn("guests", {
    is_pending_info: {
      type: "boolean",
      default: false,
      notNull: true,
    },
  })
}

exports.down = (pgm) => {
  pgm.dropColumn("guests", "is_pending_info")
}
