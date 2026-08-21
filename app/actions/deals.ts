"use server"

import { revalidatePath } from "next/cache"
import { withAgency } from "@/lib/tenant"
import { getActiveSubAccountId } from "./subaccounts"
import { generateAiReply } from "./ai"

export const getDeals = withAgency(async ({ db, userId, userRole }) => {
  const subAgencyId = await getActiveSubAccountId()

  const whereClause: any = {}
  if (subAgencyId) {
    whereClause.subAgencyId = subAgencyId
  }

  // Server-side Tenant User Scoping: If user is staff/rep (not owner/admin), scope strictly to deals assigned to them
  const isStaffOnly = userId && userRole && !userRole.toLowerCase().includes("owner") && !userRole.toLowerCase().includes("admin")
  if (isStaffOnly) {
    whereClause.assignedRepId = userId
  }

  return db.deal.findMany({
    where: whereClause,
    include: { contact: true, assignedRep: { select: { id: true, name: true, email: true } } },
    orderBy: { updatedAt: 'desc' }
  })
})

export const updateDealStage = withAgency(
  async ({ db }, dealId: string, newStage: string) => {
    const deal = await db.deal.updateMany({
      where: { id: dealId },
      data: { stage: newStage }
    })

    if (deal.count === 0) {
      throw new Error("Deal not found or access denied")
    }

    revalidatePath("/crm/deals")
    return { id: dealId, stage: newStage }
  }
)

export const createDeal = withAgency(
  async ({ db, agencyId }, data: { title: string, value: number, stage: string, contactId?: string }) => {
    const subAgencyId = await getActiveSubAccountId()

    const deal = await db.deal.create({
      data: {
        agencyId,
        subAgencyId,
        ...data
      }
    })

    revalidatePath("/crm/deals")
    return deal
  }
)

export const generateDealInsights = withAgency(
  async ({ db }, dealId: string) => {
    const deal = await db.deal.findFirst({
      where: { id: dealId },
      include: {
        contact: {
          include: {
            conversations: {
              include: {
                messages: {
                  orderBy: { createdAt: 'desc' },
                  take: 15
                }
              }
            }
          }
        }
      }
    })

    if (!deal) throw new Error("Deal not found")

    // Compile context for AI
    const history: string[] = []
    if (deal.contact?.conversations) {
      deal.contact.conversations.forEach(conv => {
        const sortedMsgs = [...conv.messages].reverse()
        sortedMsgs.forEach(m => {
          history.push(`[${m.createdAt.toISOString()}] ${m.isOutbound ? 'Agent' : 'Customer'}: ${m.content}`)
        })
      })
    }

    const contextPayload = `
Deal Title: ${deal.title}
Deal Value: $${deal.value}
Current Stage: ${deal.stage}
Contact Name: ${deal.contact?.firstName || 'Unknown'} ${deal.contact?.lastName || ''}
Company: ${deal.contact?.company || 'N/A'}

Recent Communication History:
${history.length > 0 ? history.join("\n") : "No recent communications."}
    `

    const aiRes = await generateAiReply("deal_insights", contextPayload)
    if (!aiRes.success || !aiRes.data) {
      throw new Error(aiRes.error || "Failed to generate AI insights")
    }

    let parsed
    try {
      let rawJson = aiRes.data.replace(/```json/gi, '').replace(/```/g, '').trim()
      parsed = JSON.parse(rawJson)
    } catch (e) {
      console.error("Failed to parse AI JSON:", aiRes.data)
      throw new Error("AI returned invalid JSON format")
    }

    return parsed
  }
)

export const getPipelineVelocityMetrics = withAgency(
  async ({ db, userId, userRole }) => {
    const deals = await db.deal.findMany({
      orderBy: { updatedAt: "desc" }
    })

    const now = Date.now()
    const rottingThresholdDays = 14
    const staleThresholdDays = 7

    let rottingCount = 0
    let staleCount = 0
    let totalAgeDays = 0

    const dealsWithMetrics = deals.map(deal => {
      const daysInStage = Math.max(0, Math.floor((now - new Date(deal.updatedAt).getTime()) / (1000 * 60 * 60 * 24)))
      totalAgeDays += daysInStage

      const isRotting = daysInStage >= rottingThresholdDays && deal.stage !== "won" && deal.stage !== "lost"
      const isStale = daysInStage >= staleThresholdDays && !isRotting && deal.stage !== "won" && deal.stage !== "lost"

      if (isRotting) rottingCount++
      if (isStale) staleCount++

      return {
        ...deal,
        daysInStage,
        isRotting,
        isStale
      }
    })

    const avgDaysInStage = deals.length > 0 ? Math.round(totalAgeDays / deals.length) : 0
    const wonDeals = deals.filter(d => d.stage === "won" || d.stage?.toLowerCase().includes("won"))
    const winRate = deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0

    return {
      totalDeals: deals.length,
      rottingCount,
      staleCount,
      avgDaysInStage,
      winRate,
      deals: dealsWithMetrics
    }
  }
)

