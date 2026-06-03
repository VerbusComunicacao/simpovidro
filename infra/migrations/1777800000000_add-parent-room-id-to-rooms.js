exports.shorthands = undefined

exports.up = (pgm) => {
  pgm.addColumn("rooms", {
    parent_room_id: {
      type: "uuid",
      notNull: false,
      references: '"rooms"',
      onDelete: "SET NULL",
    },
  })
}

exports.down = (pgm) => {
  pgm.dropColumn("rooms", "parent_room_id")
}
