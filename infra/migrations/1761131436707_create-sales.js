exports.up = (pgm) => {
  pgm.createTable("sales", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    hotel_id: {
      type: "uuid",
      notNull: true,
    },
    room_id: {
      type: "uuid",
      notNull: true,
    },
    company_id: {
      type: "uuid",
    },
    guest_id: {
      type: "uuid",
    },
    sale_number: {
      type: "varchar(50)",
      notNull: true,
      unique: true,
    },
    total_amount: {
      type: "numeric(10,2)",
      notNull: true,
    },
    discount_percentage: {
      type: "numeric(5,2)",
      default: 0,
    },
    discount_amount: {
      type: "numeric(10,2)",
      default: 0,
    },
    final_amount: {
      type: "numeric(10,2)",
      notNull: true,
    },
    status: {
      type: "varchar(20)",
      notNull: true,
      default: "'pending'", // pending, confirmed, cancelled, completed
    },
    payment_status: {
      type: "varchar(20)",
      notNull: true,
      default: "'pending'", // pending, paid, partial, refunded
    },
    notes: {
      type: "text",
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
