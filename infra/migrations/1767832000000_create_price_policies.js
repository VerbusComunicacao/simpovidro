exports.up = (pgm) => {
  pgm.createTable("price_policies", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    room_category_id: {
      type: "uuid",
      notNull: true,
      references: '"room-categories"',
      onDelete: "CASCADE",
    },
    max_age: {
      type: "integer",
      notNull: true,
    },
    price: {
      type: "numeric(10,2)",
      notNull: true,
    },
    description: {
      type: "varchar(255)",
      notNull: true,
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  })
}

exports.down = (pgm) => {
    pgm.dropTable("price_policies")
}
