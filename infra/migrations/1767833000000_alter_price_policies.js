exports.up = (pgm) => {
  // Remove reference to room-categories
  pgm.dropColumns("price_policies", ["room_category_id"], { cascade: true })
  
  // Add reference to hotels
  pgm.addColumns("price_policies", {
    hotel_id: {
      type: "uuid",
      notNull: true,
      references: '"hotels"',
      onDelete: "CASCADE",
    },
  })

  // Replace price with percentage
  pgm.dropColumns("price_policies", ["price"])
  pgm.addColumns("price_policies", {
    percentage: {
      type: "numeric(5,2)",
      notNull: true,
      default: 0,
    },
  })
}

exports.down = (pgm) => {
  // Revert percentage
  pgm.dropColumns("price_policies", ["percentage"])
  pgm.addColumns("price_policies", {
    price: {
      type: "numeric(10,2)",
      notNull: true,
      default: 0,
    },
  })

  // Revert FK
  pgm.dropColumns("price_policies", ["hotel_id"])
  pgm.addColumns("price_policies", {
    room_category_id: {
      type: "uuid",
      notNull: true,
      references: '"room-categories"',
      onDelete: "CASCADE",
    },
  })
}
