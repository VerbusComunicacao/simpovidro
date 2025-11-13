exports.up = (pgm) => {
  pgm.createTable("guests", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    user_id: {
      type: "uuid",
    },
    name: {
      type: "varchar(100)",
      notNull: true,
    },
    email: {
      type: "varchar(254)",
      notNull: true,
    },
    phone: {
      type: "varchar(20)",
      notNull: true,
    },
    badge_name: {
      type: "varchar(23)",
    },
    gender: {
      type: "varchar(10)",
      notNull: true,
    },
    rg_number: {
      // Documento específico do Brasil
      type: "varchar(50)",
      notNull: true,
      unique: true,
    },
    cpf_number: {
      type: "varchar(15)",
      notNull: true,
      unique: true,
    },
    passport_number: {
      type: "varchar(50)",
    },
    medication_details: {
      type: "text",
    },
    blood_type: {
      type: "varchar(10)", // A, B, AB, O
    },
    blood_rh_factor: {
      type: "varchar(20)", // Positive, Negative
    },
    health_observations: {
      type: "text",
    },
    special_needs_details: {
      type: "text",
    },

    has_heart_condition: {
      type: "boolean",
      notNull: true,
      default: false,
    },
    // [par_bt_Diabete] BIT NOT NULL
    has_diabetes: {
      type: "boolean",
      notNull: true,
      default: false,
    },
    // [par_bt_PressaoAlta] BIT NOT NULL
    has_high_blood_pressure: {
      type: "boolean",
      notNull: true,
      default: false,
    },
    // [par_bt_PressaoBaixa] BIT NOT NULL
    has_low_blood_pressure: {
      type: "boolean",
      notNull: true,
      default: false,
    },

    birth_date: {
      type: "date",
      notNull: true,
    },
    nationality: {
      type: "varchar(100)",
      default: "'Brasileira'",
    },
    address: {
      type: "varchar(255)",
    },
    address_number: {
      type: "varchar(100)",
    },
    address_complement: {
      type: "varchar(100)",
    },
    neighborhood: {
      type: "varchar(100)",
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
