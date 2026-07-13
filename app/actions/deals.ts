"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getDeals(agencyId: string) {
  try {
    const deals = await db.deal.findMany({
      where: { agencyId },
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
