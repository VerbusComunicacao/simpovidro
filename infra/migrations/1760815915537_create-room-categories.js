exports.up = (pgm) => {
  pgm.createTable("room-categories", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    user_id: {
      type: "uuid",
      notNull: true,
    },
    name: {
      type: "varchar(100)",
      notNull: true,
    },
    max_adults: {
      type: "integer",
      notNull: true,
      default: 1,
    },
    max_children: {
      type: "integer",
      notNull: true,
      default: 0,
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
exports.down = false
