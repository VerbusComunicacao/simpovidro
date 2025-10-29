exports.up = (pgm) => {
  pgm.createTable("hotels", {
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
      type: "varchar(150)",
      notNull: true,
    },
    email: {
      type: "varchar(254)",
    },
    phone: {
      type: "varchar(20)",
    },
    address: {
      type: "varchar(255)",
    },
    city: {
      type: "varchar(100)",
      notNull: true,
    },
    state: {
      type: "varchar(100)",
    },
    country: {
      type: "varchar(100)",
      default: "'Brasil'",
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
