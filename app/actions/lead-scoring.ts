"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export interface LeadScoringRules {
  emailOpenPoints?: number
  linkClickPoints?: number
  formSubmitPoints?: number
  pageVisitPoints?: number
  inactivityPenaltyPoints?: number
  autoStageThreshold?: number
  autoStageId?: string
}

export async function calculateContactScore(contactId: string, rules: LeadScoringRules = {}) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const contact = await db.contact.findFirst({
      where: { id: contactId, agencyId: auth.agencyId },
      include: { conversations: { include: { messages: true } }, deals: true }
    })

    if (!contact) return { success: false, error: "Contact not found" }

    let score = 0
    const emailOpens = rules.emailOpenPoints || 5
    const linkClicks = rules.linkClickPoints || 10
    const formSubmits = rules.formSubmitPoints || 25
    const inactivityPenalty = rules.inactivityPenaltyPoints || 20

    // Count interaction history from messages
    let totalMessages = 0
    for (const conv of contact.conversations) {
      totalMessages += conv.messages.length
    }

    score += totalMessages * linkClicks
    if (contact.leadScore) score += contact.leadScore

    // Check inactivity
    const lastInteraction = contact.updatedAt
    const daysInactive = (Date.now() - new Date(lastInteraction).getTime()) / (1000 * 60 * 60 * 24)
    if (daysInactive > 30) {
      score -= inactivityPenalty
    }

    const finalScore = Math.max(0, score)

    // Update contact leadScore
    await db.contact.update({
      where: { id: contact.id },
      data: { leadScore: finalScore }
    })

    // Check auto stage progression threshold
    const threshold = rules.autoStageThreshold || 100
    if (finalScore >= threshold && contact.deals.length > 0) {
      const targetDeal = contact.deals[0]
      if (rules.autoStageId) {
        await db.deal.update({
          where: { id: targetDeal.id },
          data: { stage: rules.autoStageId }
        })
      }
    }

    revalidatePath("/crm/contacts")
    return { success: true, newScore: finalScore }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
