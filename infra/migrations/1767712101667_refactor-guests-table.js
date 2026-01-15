exports.up = (pgm) => {
  pgm.dropColumn("guests", "email")
}
