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

  // MODERATION
  "read:user:list",
  "read:votes:others",
  "update:content:others",
  "update:user:others",
  "ban:user",
  "create:recovery_token:username",
  "read:firewall",
  "review:firewall",

  // BANNED
  "nuked",

  // ADVERTISEMENT
  "read:ad:list",
])

export default Object.freeze(availableFeatures)
