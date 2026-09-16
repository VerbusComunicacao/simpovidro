exports.up = (pgm) => {
  pgm.createTable("tournament_registrations", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "CASCADE",
    },
    tournament: {
      type: "varchar(30)",
      notNull: true,
    },
    company_name: {
      type: "varchar(255)",
      notNull: true,
    },
    participant_name: {
      type: "varchar(255)",
      notNull: true,
    },
    phone: {
      type: "varchar(30)",
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

  pgm.createIndex("tournament_registrations", "user_id")
  pgm.createIndex("tournament_registrations", "tournament")
}

exports.down = false
