
exports.up = (pgm) => {
  pgm.addColumns("hotels", {
    check_in_date: { type: "timestamptz" },
    check_out_date: { type: "timestamptz" },
  });
};
