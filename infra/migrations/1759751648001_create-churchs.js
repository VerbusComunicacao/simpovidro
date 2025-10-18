exports.up = (pgm) => {
  pgm.createTable("churchs", {
    id: {
      type: "uuid",
      primarykey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    user_id: {
      type: "uuid",
      notNull: true,
    },
    name: {
      type: "varchar(254)",
      notNull: true,
    },
    created_at: {
      type: "timestamptz",
      default: pgm.func("timezone('utc', now())"),
      notNull: true,
    },
    updated_at: {
      type: "timestamptz",
      default: pgm.func("timezone('utc', now())"),
      notNull: true,
    },
  })
}

exports.down = false
