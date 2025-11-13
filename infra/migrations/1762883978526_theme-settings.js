exports.up = (pgm) => {
  pgm.createTable("theme_settings", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    user_id: {
      type: "uuid",
      notNull: true,
      unique: true,
    },
    colors: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'{}'::jsonb"),
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
