exports.up = (pgm) => {
  pgm.createTable("password_recovery_tokens", {
    id: {
      type: "uuid",
      default: pgm.func("gen_random_uuid()"),
      primaryKey: true,
    },
    token: {
      type: "varchar(100)",
      notNull: true,
      unique: true,
    },
    user_id: {
      type: "uuid",
      notNull: true,
    },
    expires_at: {
      type: "timestamptz",
      notNull: true,
    },
    used_at: {
      type: "timestamptz",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  })
}
