/**
 * Email & Template Placeholder Validator
 * Scans template content for invalid or mistyped shortcodes.
 */

const VALID_PLACEHOLDERS = new Set([
  "contact.firstName",
  "contact.lastName",
  "contact.email",
  "contact.phone",
  "contact.company",
  "contact.score",
  "agency.name",
  "agency.subdomain",
  "appointment.startTime",
  "appointment.title",
  "deal.title",
  "deal.value",
  "deal.stage",
  "user.name",
  "user.email"
])

export interface ValidationResult {
  isValid: boolean
  invalidTags: string[]
  suggestions: Record<string, string>
}

export function validateTemplatePlaceholders(text: string): ValidationResult {
  const matches = text.match(/\{\{([^}]+)\}\}/g) || []
  const invalidTags: string[] = []
  const suggestions: Record<string, string> = {}

  for (const rawTag of matches) {
    const cleanTag = rawTag.replace(/[\{\}\s]/g, "")
    if (!VALID_PLACEHOLDERS.has(cleanTag)) {
      invalidTags.push(rawTag)

      // Suggest close matches
      if (cleanTag === "contact.name") suggestions[rawTag] = "{{contact.firstName}}"
      else if (cleanTag === "contact.mail") suggestions[rawTag] = "{{contact.email}}"
      else if (cleanTag === "company.name") suggestions[rawTag] = "{{agency.name}}"
      else suggestions[rawTag] = "{{contact.firstName}}"
    }
  }

  return {
    isValid: invalidTags.length === 0,
    invalidTags: Array.from(new Set(invalidTags)),
    suggestions
  }
}
