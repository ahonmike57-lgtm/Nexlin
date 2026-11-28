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
      include: {
        conversations: { include: { messages: { select: { id: true } } } },
        deals: { where: { deletedAt: null }, select: { id: true, stage: true } },
      },
    })

    if (!contact) throw new Error("Contact not found")

    const linkClicks = rules.linkClickPoints ?? 10
    const inactivityPenalty = rules.inactivityPenaltyPoints ?? 20

    let totalMessages = 0
    for (const conv of contact.conversations) {
      totalMessages += conv.messages.length
    }

    let wonDeals = 0
    let openDeals = 0
    for (const deal of contact.deals) {
      const st = (deal.stage || "").toLowerCase()
      if (st.includes("won") || st.includes("closed")) {
        wonDeals++
      } else {
        openDeals++
      }
    }

    const dealBonus = wonDeals * 25 + openDeals * 10
    let score = totalMessages * linkClicks + dealBonus

    const lastInteraction = contact.updatedAt
    const daysInactive = (Date.now() - new Date(lastInteraction).getTime()) / (1000 * 60 * 60 * 24)
    if (daysInactive > 30) {
      score -= inactivityPenalty
    }

    const finalScore = Math.max(0, Math.round(score))

    await db.contact.updateMany({
      where: { id: contact.id },
      data: { leadScore: finalScore },
    })

    const threshold = rules.autoStageThreshold || 100
    if (finalScore >= threshold && contact.deals.length > 0 && rules.autoStageId) {
      const targetDeal = contact.deals[0]
      await db.deal.updateMany({
        where: { id: targetDeal.id },
        data: { stage: rules.autoStageId },
      })
    }

    revalidatePath("/crm/contacts")
    return { contactId, newScore: finalScore }
  }
)
