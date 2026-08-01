"use server"

import { revalidatePath } from "next/cache"
import { withAgency } from "@/lib/tenant"

export interface LeadScoringRules {
  emailOpenPoints?: number
  linkClickPoints?: number
  formSubmitPoints?: number
  pageVisitPoints?: number
  inactivityPenaltyPoints?: number
  autoStageThreshold?: number
  autoStageId?: string
}

export const calculateContactScore = withAgency(
  async ({ db }, contactId: string, rules: LeadScoringRules = {}) => {
    const contact = await db.contact.findFirst({
      where: { id: contactId },
      include: { conversations: { include: { messages: true } }, deals: true }
    })

    if (!contact) throw new Error("Contact not found")

    let score = 0
    const linkClicks = rules.linkClickPoints || 10
    const inactivityPenalty = rules.inactivityPenaltyPoints || 20

    let totalMessages = 0
    for (const conv of contact.conversations) {
      totalMessages += conv.messages.length
    }

    score += totalMessages * linkClicks
    if (contact.leadScore) score += contact.leadScore

    const lastInteraction = contact.updatedAt
    const daysInactive = (Date.now() - new Date(lastInteraction).getTime()) / (1000 * 60 * 60 * 24)
    if (daysInactive > 30) {
      score -= inactivityPenalty
    }

    const finalScore = Math.max(0, score)

    await db.contact.updateMany({
      where: { id: contact.id },
      data: { leadScore: finalScore }
    })

    const threshold = rules.autoStageThreshold || 100
    if (finalScore >= threshold && contact.deals.length > 0) {
      const targetDeal = contact.deals[0]
      if (rules.autoStageId) {
        await db.deal.updateMany({
          where: { id: targetDeal.id },
          data: { stage: rules.autoStageId }
        })
      }
    }

    revalidatePath("/crm/contacts")
    return { contactId, newScore: finalScore }
  }
)
