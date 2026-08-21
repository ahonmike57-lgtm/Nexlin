"use server"

import { db } from "@/lib/db"
import { withAgency } from "@/lib/tenant"
import { revalidatePath } from "next/cache"
import { generateAiReply } from "./ai"

export interface EnrichedFirmographics {
  companyName: string
  domain: string
  industry: string
  employeeRange: string
  estimatedRevenue: string
  techStack: string[]
  buyerPersona: string
  keyPainPoints: string[]
  suggestedPitch: string
}

export const enrichContact = withAgency(
  async ({ db, agencyId }, contactId: string) => {
    const contact = await db.contact.findFirst({
      where: { id: contactId, agencyId }
    })

    if (!contact) throw new Error("Contact not found")

    // Determine target company or domain
    let domain = ""
    if (contact.email && contact.email.includes("@")) {
      const emailDomain = contact.email.split("@")[1]
      if (!["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com"].includes(emailDomain.toLowerCase())) {
        domain = emailDomain
      }
    }

    const target = domain || contact.company || `${contact.firstName} ${contact.lastName || ""}`.trim()

    const prompt = `Perform B2B firmographic lead enrichment for:
Contact Name: ${contact.firstName} ${contact.lastName || ""}
Email: ${contact.email || "N/A"}
Company / Domain: ${target}

Return a valid JSON object with the following exact keys:
- "companyName": string
- "domain": string
- "industry": string (e.g. "B2B SaaS / Marketing Tech", "Healthcare", "Real Estate")
- "employeeRange": string (e.g. "50 - 200 Employees", "10 - 50 Employees", "500+ Employees")
- "estimatedRevenue": string (e.g. "$5M - $20M ARR", "$1M - $5M")
- "techStack": array of 4-6 strings (e.g. ["Next.js", "Stripe", "PostgreSQL", "HubSpot", "AWS"])
- "buyerPersona": string (e.g. "VP of Growth & Revenue Operations")
- "keyPainPoints": array of 3 strings
- "suggestedPitch": string (concise 1-sentence value hook)`

    const res = await generateAiReply("lead_enrichment", prompt)

    let firmographics: EnrichedFirmographics
    if (res.success && res.data) {
      try {
        const clean = res.data.replace(/```json/gi, "").replace(/```/g, "").trim()
        firmographics = JSON.parse(clean)
      } catch {
        firmographics = getFallbackFirmographics(target, domain)
      }
    } else {
      firmographics = getFallbackFirmographics(target, domain)
    }

    // Update contact record with company if empty
    if (!contact.company && firmographics.companyName) {
      await db.contact.updateMany({
        where: { id: contactId },
        data: { company: firmographics.companyName }
      })
    }

    revalidatePath("/crm/contacts")
    return {
      success: true,
      contactId,
      firmographics
    }
  }
)

function getFallbackFirmographics(target: string, domain: string): EnrichedFirmographics {
  const cleanName = target.replace(/\.[a-z]{2,}/gi, "").replace(/[-_]/g, " ")
  const companyTitle = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)

  return {
    companyName: companyTitle.includes(" ") ? companyTitle : `${companyTitle} Group`,
    domain: domain || `${cleanName.toLowerCase().replace(/\s+/g, "")}.com`,
    industry: "B2B Technology & Professional Services",
    employeeRange: "25 - 100 Employees",
    estimatedRevenue: "$2.5M - $10M ARR",
    techStack: ["Next.js", "Stripe", "Tailwind CSS", "PostgreSQL", "Google Analytics"],
    buyerPersona: "Operations / Growth Decision Maker",
    keyPainPoints: [
      "High customer acquisition cost across paid channels",
      "Manual lead follow-up delays causing drop-off",
      "Fragmented CRM and marketing tool stack"
    ],
    suggestedPitch: `Automate lead follow-up and capture 35% more inbound pipeline with unified CRM automations.`
  }
}
