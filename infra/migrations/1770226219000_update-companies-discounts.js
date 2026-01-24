exports.up = (pgm) => {
  // 1. Add new columns
  pgm.addColumns("companies", {
    discount_id: {
      type: "uuid",
      references: '"discounts"',
      onDelete: "SET NULL",
    },
    custom_discount_percentage: {
      type: "numeric(5,2)",
      default: null,
    },
  })

  // 2. Data Migration
  // Insert default discount type and associate existing companies
  pgm.sql(`
    INSERT INTO discounts (name, value)
    VALUES ('Associada', 20.00)
    ON CONFLICT (name) DO NOTHING;
  `)

  pgm.sql(`
    UPDATE companies
    SET discount_id = (SELECT id FROM discounts WHERE name = 'Associada' LIMIT 1)
    WHERE discount_status = 'S';
  `)

  // 3. Remove old column
  pgm.dropColumns("companies", ["discount_status"])
}

exports.down = (pgm) => {
  pgm.addColumns("companies", {
    discount_status: {
      type: "char(1)",
      default: "'N'",
    },
  })

  pgm.sql(`
    UPDATE companies
    SET discount_status = 'S'
    WHERE discount_id IS NOT NULL;
  `)

  pgm.dropColumns("companies", ["discount_id", "custom_discount_percentage"])
}
