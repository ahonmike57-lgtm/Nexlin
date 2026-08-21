/**
 * NEXLIN GHL Dynamic Merge Tag Interpolation Engine
 *
 * Supports syntax:
 *  - {{contact.firstName}}
 *  - {{contact.lastName}}
 *  - {{contact.fullName}}
 *  - {{contact.email}}
 *  - {{contact.phone}}
 *  - {{contact.company}}
 *  - {{contact.leadScore}}
 *  - {{agency.name}}
 *  - {{agency.customDomain}}
 *  - {{deal.title}}
 *  - {{deal.value}}
 *  - {{deal.value | currency}}
 *  - {{appointment.title}}
 *  - {{appointment.startTime | date}}
 *  - {{contact.firstName | "Valued Customer"}}
 */

export interface MergeTagContext {
  contact?: {
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    phone?: string | null
    company?: string | null
    leadScore?: number | null
    [key: string]: any
  }
  agency?: {
    name?: string | null
    subdomain?: string | null
    customDomain?: string | null
    [key: string]: any
  }
  deal?: {
    title?: string | null
    value?: number | null
    stage?: string | null
    [key: string]: any
  }
  appointment?: {
    title?: string | null
    startTime?: Date | string | null
    endTime?: Date | string | null
    [key: string]: any
  }
  customValues?: Record<string, string | number | boolean | null | undefined>
}

export function interpolateMergeTags(template: string, context: MergeTagContext = {}): string {
  if (!template || typeof template !== "string") return ""

  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, expression) => {
    try {
      const parts = expression.split("|").map((p: string) => p.trim())
      const path = parts[0]
      const filterOrFallback = parts.slice(1).join("|").trim()

      const resolvedValue = getValueByPath(path, context)

      if (resolvedValue !== undefined && resolvedValue !== null && resolvedValue !== "") {
        // Apply filter if specified
        if (filterOrFallback.toLowerCase() === "currency") {
          const num = Number(resolvedValue)
          return isNaN(num) ? String(resolvedValue) : `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        }
        if (filterOrFallback.toLowerCase() === "date") {
          const d = new Date(resolvedValue)
          return isNaN(d.getTime()) ? String(resolvedValue) : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
        }
        if (filterOrFallback.toLowerCase() === "datetime") {
          const d = new Date(resolvedValue)
          return isNaN(d.getTime()) ? String(resolvedValue) : d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
        }
        return String(resolvedValue)
      }

      // If value is empty, evaluate fallback
      if (filterOrFallback) {
        // Remove surrounding quotes if present
        const cleanFallback = filterOrFallback.replace(/^["']|["']$/g, "")
        if (!["currency", "date", "datetime"].includes(cleanFallback.toLowerCase())) {
          return cleanFallback
        }
      }

      return ""
    } catch {
      return match
    }
  })
}

function getValueByPath(path: string, context: MergeTagContext): any {
  // Special computed values
  if (path === "contact.fullName") {
    const first = context.contact?.firstName || ""
    const last = context.contact?.lastName || ""
    return `${first} ${last}`.trim() || undefined
  }

  // Handle customValues shorthand e.g. {{custom.booking_link}}
  if (path.startsWith("custom.") && context.customValues) {
    const key = path.replace("custom.", "")
    return context.customValues[key]
  }

  const keys = path.split(".")
  let current: any = context

  for (const k of keys) {
    if (current === undefined || current === null) return undefined
    current = current[k]
  }

  return current
}
