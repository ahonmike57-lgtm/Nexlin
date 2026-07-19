"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getOrCreateAgency } from "./agency"
import { getActiveSubAccountId } from "./subaccounts"
import { generateAiReply } from "./ai"

export async function getDeals() {
  try {
    const agencyId = await getOrCreateAgency()
    const subAgencyId = await getActiveSubAccountId()
    
    const whereClause: any = { agencyId }
    if (subAgencyId) {
      whereClause.subAgencyId = subAgencyId
    }

    const deals = await db.deal.findMany({
      where: whereClause,
      include: { contact: true },
      orderBy: { updatedAt: 'desc' }
    })
    return { success: true, data: deals }
  } catch (error) {
    console.error("Failed to fetch deals:", error)
    return { success: false, error: "Failed to fetch deals" }
  }
}

export async function updateDealStage(dealId: string, newStage: string) {
  try {
    const deal = await db.deal.update({
      where: { id: dealId },
      data: { stage: newStage }
    })
    
    revalidatePath("/crm/deals")
    return { success: true, data: deal }
  } catch (error) {
    console.error("Failed to update deal:", error)
    return { success: false, error: "Failed to update deal" }
  }
}

export async function createDeal(data: { title: string, value: number, stage: string, contactId?: string }) {
  try {
    const agencyId = await getOrCreateAgency()
    const subAgencyId = await getActiveSubAccountId()
    
    const deal = await db.deal.create({
      data: {
        agencyId,
        subAgencyId,
        ...data
      }
    })
    
    revalidatePath("/crm/deals")
    return { success: true, data: deal }
  } catch (error: any) {
    console.error("Failed to create deal:", error)
    return { success: false, error: error.message || "Failed to create deal" }
  }
}

export async function generateDealInsights(dealId: string) {
  try {
    const deal = await db.deal.findUnique({
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

    // Compile the context for the AI
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
      // Clean up potential markdown formatting if the model leaked it
      let rawJson = aiRes.data.replace(/```json/gi, '').replace(/```/g, '').trim()
      parsed = JSON.parse(rawJson)
    } catch (e) {
      console.error("Failed to parse AI JSON:", aiRes.data)
      throw new Error("AI returned invalid JSON format")
    }

    return { success: true, data: parsed }
  } catch (error: any) {
    console.error("AI Insights Error:", error)
    return { success: false, error: error.message || "Failed to generate insights" }
  }
}
