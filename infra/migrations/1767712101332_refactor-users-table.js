exports.up = (pgm) => {
  pgm.addColumn("users", {
    full_name: {
      type: "varchar(100)",
      notNull: true,
      default: "Usuário",
    },
  })

  pgm.alterColumn("users", "full_name", { notNull: true })

  pgm.dropColumn("users", "username")
}
