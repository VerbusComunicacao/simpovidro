exports.up = (pgm) => {
  pgm.createTable("guests", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    first_name: {
      type: "varchar(100)",
      notNull: true,
    },
    last_name: {
      type: "varchar(100)",
      notNull: true,
    },
    email: {
      type: "varchar(254)",
      notNull: true,
    },
    phone: {
      type: "varchar(20)",
    },
    document_type: {
      type: "varchar(20)", // CPF, RG, Passport, etc.
    },
    document_number: {
      type: "varchar(50)",
    },
    birth_date: {
      type: "date",
    },
    nationality: {
      type: "varchar(100)",
      default: "'Brasileira'",
    },
    address: {
      type: "varchar(255)",
    },
    city: {
      type: "varchar(100)",
    },
    state: {
      type: "varchar(100)",
    },
    country: {
      type: "varchar(100)",
      default: "'Brasil'",
    },
    emergency_contact_name: {
      type: "varchar(200)",
    },
    emergency_contact_phone: {
      type: "varchar(20)",
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
