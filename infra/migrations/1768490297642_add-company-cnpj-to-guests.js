exports.up = (pgm) => {
  pgm.addColumn("guests", {
    company_cnpj: {
      type: "varchar(18)",
      comment: "CNPJ da empresa do hóspede",
    },
  })
}
