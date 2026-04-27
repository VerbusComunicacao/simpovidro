exports.up = (pgm) => {
  pgm.createTable("room_price_policies", {
    id: {
      type: "uuid",
      notNull: true,
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    room_id: {
      type: "uuid",
      notNull: true,
      references: '"rooms"',
      onDelete: "CASCADE",
    },
    price_policy_id: {
      type: "uuid",
      notNull: true,
      references: '"price_policies"',
      onDelete: "CASCADE",
    },
    price: {
      type: "numeric(10,2)",
      notNull: true,
    },
    created_at: {
      type: "timestamp with time zone",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
    updated_at: {
      type: "timestamp with time zone",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  })

  pgm.createIndex("room_price_policies", ["room_id", "price_policy_id"], {
    unique: true,
  })
}

exports.down = (pgm) => {
  pgm.dropTable("room_price_policies")
}
