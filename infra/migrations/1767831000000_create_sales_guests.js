exports.up = (pgm) => {
  pgm.createTable("sales_guests", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    sale_id: {
      type: "uuid",
      notNull: true,
      references: '"sales"',
      onDelete: "CASCADE",
    },
    guest_id: {
      type: "uuid",
      notNull: true,
      references: '"guests"',
      onDelete: "CASCADE",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  })

  pgm.addConstraint("sales_guests", "sales_guests_sale_id_guest_id_unique", {
    unique: ["sale_id", "guest_id"],
  })
}

exports.down = (pgm) => {
  pgm.dropTable("sales_guests")
}
