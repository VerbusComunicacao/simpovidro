exports.up = (pgm) => {
  pgm.createTable("members", {
    id: {
      type: "uuid",
      primarykey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    church_id: {
      type: "uuid",
      notNull: true,
    },
    first_name: {
      type: "varchar(50)",
      notNull: true,
    },
    last_name: {
      type: "varchar(50)",
      notNull: true,
    },
    email: {
      type: "varchar(254)",
      notNull: true,
      unique: true,
    },

    //Why 60 in length? https://www.npmjs.com/package/bcrypt#hash-info
    password: {
      type: "varchar(60)",
      notNull: true,
    },

    //why timestamp with timezone? https://justatheory.com/2012/04/postgres-use-timestamptz
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
