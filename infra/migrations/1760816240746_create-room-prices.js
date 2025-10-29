exports.up = (pgm) => {
  pgm.createTable("rooms", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    user_id: {
      type: "uuid",
      notNull: true,
    },
    hotel_id: {
      type: "uuid",
      notNull: true,
    },
    room_type_id: {
      type: "uuid",
      notNull: true,
    },
    room_category_id: {
      type: "uuid",
      notNull: true,
    },
    price_per_night: {
      type: "numeric(10,2)",
      notNull: true,
      default: 0,
    },
    total_rooms: {
      type: "integer",
      notNull: true,
      default: 0,
    },
    available_rooms: {
      type: "integer",
      notNull: true,
      default: 0,
    },
    blocked_rooms: {
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
