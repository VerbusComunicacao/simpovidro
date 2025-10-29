exports.up = (pgm) => {
  pgm.createTable("companies", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    corporate_name: {
      type: "varchar(200)",
      notNull: true,
    },
    badge: {
      type: "varchar(23)",
    },
    cnpj: {
      type: "varchar(20)",
      unique: true,
    },
    address: {
      type: "varchar(200)",
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
      notNull: true,
    },
    state: {
      type: "varchar(100)",
    },
    country: {
      type: "varchar(100)",
      default: "'Brasil'",
    },
    phone: {
      type: "varchar(30)",
    },
    permission: {
      type: "char(1)",
      default: "'A'", // A = Ativo, I = Inativo
    },
    discount_status: {
      type: "char(1)",
      default: "'N'", // S = Sim, N = Não
    },
    email: {
      type: "varchar(200)",
    },
    responsible_person: {
      type: "varchar(150)",
    },
    zip_code: {
      type: "varchar(20)",
    },
    last_registration_date: {
      type: "timestamptz",
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
