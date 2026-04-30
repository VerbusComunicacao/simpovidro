exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn("sales", {
    bed_preference: {
      type: "text",
      notNull: false,
    },
  })
}

exports.down = (pgm) => {
  pgm.dropColumn("sales", "bed_preference")
}
