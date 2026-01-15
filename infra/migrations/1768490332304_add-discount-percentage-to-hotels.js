exports.up = (pgm) => {
  pgm.addColumn("hotels", {
    associated_company_discount_percentage: {
      type: "numeric(5,2)",
      notNull: true,
      default: 20.0,
      comment: "Porcentagem de desconto para empresas associadas da Abravidro",
    },
  })
}
