exports.up = (pgm) => {
  pgm.createTable("sale_installments", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    sale_id: {
      type: "uuid",
      notNull: true,
      references: '"sales"',
      onDelete: "CASCADE",
    },
    installment_number: {
      type: "integer",
      notNull: true,
    },
    amount: {
      type: "numeric(10,2)",
      notNull: true,
    },
    due_date: {
      type: "date",
      notNull: true,
    },
    status: {
      type: "varchar(20)",
      notNull: true,
      default: "pending", // pending, paid, overdue, canceled
    },
    paid_amount: {
      type: "numeric(10,2)",
      notNull: true,
      default: 0,
    },
    payment_date: {
      type: "timestamptz",
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

  // Constraints
  pgm.addConstraint(
    "sale_installments",
    "sale_installments_sale_id_number_unique",
    {
      unique: ["sale_id", "installment_number"],
    },
  )

  pgm.addConstraint("sale_installments", "sale_installments_amount_positive", {
    check: "amount > 0",
  })

  pgm.addConstraint("sale_installments", "sale_installments_number_positive", {
    check: "installment_number > 0",
  })

  // Indexes
  pgm.createIndex("sale_installments", "sale_id")
  pgm.createIndex("sale_installments", "status")
  pgm.createIndex("sale_installments", "due_date")
}

exports.down = false
