exports.up = (pgm) => {
  pgm.dropColumn("hotels", "associated_company_discount_percentage")
}
