exports.up = (pgm) => {
  pgm.createTable("flight_transfers", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    hotel_id: {
      type: "uuid",
      notNull: true,
      references: "hotels",
      onDelete: "CASCADE",
    },
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "CASCADE",
    },
    sale_id: {
      type: "uuid",
      notNull: false,
      references: "sales",
      onDelete: "SET NULL",
    },
    guest_id: {
      type: "uuid",
      notNull: false,
      references: "guests",
      onDelete: "SET NULL",
    },
    participant_name: {
      type: "varchar(255)",
      notNull: true,
    },
    participant_cpf: {
      type: "varchar(50)",
      notNull: false,
    },
    participant_email: {
      type: "varchar(255)",
      notNull: false,
    },
    participant_phone: {
      type: "varchar(50)",
      notNull: false,
    },
    company_name: {
      type: "varchar(255)",
      notNull: false,
    },
    // Voo de Ida (IN)
    in_date: {
      type: "varchar(30)",
      notNull: false,
    },
    in_airline: {
      type: "varchar(100)",
      notNull: false,
    },
    in_locator: {
      type: "varchar(50)",
      notNull: false,
    },
    in_flight_number: {
      type: "varchar(50)",
      notNull: false,
    },
    in_origin_airport: {
      type: "varchar(100)",
      notNull: false,
    },
    in_arrival_time: {
      type: "varchar(30)",
      notNull: false,
    },
    in_destination_airport: {
      type: "varchar(100)",
      notNull: false,
    },
    // Voo de Volta (OUT)
    out_date: {
      type: "varchar(30)",
      notNull: false,
    },
    out_airline: {
      type: "varchar(100)",
      notNull: false,
    },
    out_locator: {
      type: "varchar(50)",
      notNull: false,
    },
    out_flight_number: {
      type: "varchar(50)",
      notNull: false,
    },
    out_departure_airport: {
      type: "varchar(100)",
      notNull: false,
    },
    out_departure_time: {
      type: "varchar(30)",
      notNull: false,
    },
    out_destination_airport: {
      type: "varchar(100)",
      notNull: false,
    },
    notes: {
      type: "text",
      notNull: false,
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

  pgm.createIndex("flight_transfers", "hotel_id")
  pgm.createIndex("flight_transfers", "user_id")
  pgm.createIndex("flight_transfers", "sale_id")
  pgm.createIndex("flight_transfers", "guest_id")
}

exports.down = false
