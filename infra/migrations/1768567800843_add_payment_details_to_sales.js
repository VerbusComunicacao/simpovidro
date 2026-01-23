exports.up = (pgm) => {
  pgm.addColumns("sales", {
    payment_method: {
      type: "varchar(20)",
      notNull: true,
      default: "'cash'", // cash, installments
    },
    installments_count: {
      type: "integer",
      notNull: true,
      default: 1,
    },
  })
}
