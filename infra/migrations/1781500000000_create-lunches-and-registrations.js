exports.up = (pgm) => {
  pgm.dropTable("lunch_registrations", { ifExists: true, cascade: true })
  pgm.dropTable("lunches", { ifExists: true, cascade: true })

  pgm.createTable("lunches", {
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
    title: {
      type: "varchar(255)",
      notNull: true,
    },
    speakers: {
      type: "text",
      notNull: true,
    },
    active: {
      type: "boolean",
      notNull: true,
      default: true,
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

  pgm.createIndex("lunches", "hotel_id")
  pgm.createIndex("lunches", "active")

  pgm.createTable("lunch_registrations", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    lunch_id: {
      type: "uuid",
      notNull: true,
      references: "lunches",
      onDelete: "CASCADE",
    },
    guest_id: {
      type: "uuid",
      notNull: true,
      references: "guests",
      onDelete: "CASCADE",
    },
    sale_id: {
      type: "uuid",
      notNull: true,
      references: "sales",
      onDelete: "CASCADE",
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

  pgm.createIndex("lunch_registrations", "lunch_id")
  pgm.createIndex("lunch_registrations", "guest_id")
  pgm.createIndex("lunch_registrations", "sale_id")
  pgm.createIndex("lunch_registrations", "created_at")

  pgm.addConstraint("lunch_registrations", "unique_guest_lunch", {
    unique: ["guest_id", "lunch_id"],
  })

  // Seed default 5 tables in order requested:
  // Energia, Mercado Global, Inteligência Artificial, Reforma Tributária, Clínica de Gestão e Mudança, Além do Vidro
  pgm.sql(`
    DO $$
    DECLARE
      target_hotel_id uuid;
    BEGIN
      SELECT id INTO target_hotel_id FROM hotels WHERE active = true LIMIT 1;
      IF target_hotel_id IS NULL THEN
        SELECT id INTO target_hotel_id FROM hotels ORDER BY created_at DESC LIMIT 1;
      END IF;

      IF target_hotel_id IS NOT NULL THEN
        INSERT INTO lunches (hotel_id, title, speakers)
        VALUES
          (
            target_hotel_id,
            'Energia',
            'Jean Vinicius Tremura, Carlos Alberto Schoeps'
          ),
          (
            target_hotel_id,
            'Mercado Global',
            'Davide Cappellino (AGC), Leopoldo Castiella (NSG)'
          ),
          (
            target_hotel_id,
            'Inteligência Artificial',
            'Tiago Amor, Aristóteles Terceiro Neto, Betânia Danelon'
          ),
          (
            target_hotel_id,
            'Reforma Tributária',
            'Lucilene Prado, Halim José Abud Neto'
          ),
          (
            target_hotel_id,
            'Clínica de Gestão e Mudança, Além do Vidro',
            'Rodrigo Fontana'
          );
      END IF;
    END $$;
  `)
}

exports.down = false
