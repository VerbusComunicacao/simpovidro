exports.up = (pgm) => {
  pgm.createSequence("sales_sale_number_seq", {
    start: 100,
    increment: 1,
  })

  pgm.alterColumn("sales", "sale_number", {
    default: pgm.func("nextval('sales_sale_number_seq')::text"),
  })
}

exports.down = false
