const availableFeatures = new Set([
  // USER
  "create:user",
  "read:user",
  "read:user:self",
  "update:user",

  // MIGRATION
  "read:migration",
  "create:migration",

  // ACTIVATION_TOKEN
  "read:activation_token",

  // RECOVERY_TOKEN
  "read:recovery_token",

  // EMAIL_CONFIRMATION_TOKEN
  "read:email_confirmation_token",

  // SESSION
  "create:session",
  "read:session",

  // CONTENT (Hotel, Room types, categories, etc.)
  "read:content",
  "update:content",
  "create:content",
  "delete:content",

  // COMPANY
  "read:company",
  "update:company",
  "create:company",
  "delete:company",

  // Guests
  "read:guest",
  "update:guest",
  "create:guest",
  "delete:guest",

  // BANNED
  "nuked",

  // ADVERTISEMENT
  "read:ad:list",
])

export default Object.freeze(availableFeatures)
