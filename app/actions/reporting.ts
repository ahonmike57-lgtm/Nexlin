"use server"

import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function getDashboardMetrics(agencyId: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // Fetch aggregate counts
    const totalContacts = await db.contact.count({ where: { agencyId } })
    const totalDeals = await db.deal.count({ where: { agencyId } })
    const totalCampaigns = await db.campaign.count({ where: { agencyId } })
    
    const deals = await db.deal.findMany({
      where: { agencyId },
      select: { value: true }
    })
    const pipelineValue = deals.reduce((acc, deal) => acc + (deal.value || 0), 0)

    return {
      success: true,
      data: {
        totalContacts,
        totalDeals,
        totalCampaigns,
        pipelineValue
      }
    }
  } catch (error) {
    console.error("Failed to fetch metrics:", error)
    return { success: false, error: "Failed to fetch metrics" }
  }
}
