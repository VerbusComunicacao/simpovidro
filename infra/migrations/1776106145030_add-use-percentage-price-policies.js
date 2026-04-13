exports.up = (pgm) => {
  pgm.addColumns("price_policies", {
    use_percentage: {
      type: "boolean",
      notNull: true,
      default: true,
    },
  })
}
