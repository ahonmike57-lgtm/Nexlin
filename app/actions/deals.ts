"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getOrCreateAgency } from "./agency"

export async function getDeals() {
  try {
    const agencyId = await getOrCreateAgency()
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

export async function createDeal(data: { title: string, value: number, stage: string, contactId?: string }) {
  try {
    const agencyId = await getOrCreateAgency()
    const deal = await db.deal.create({
      data: {
        agencyId,
        ...data
      }
    })
    
    revalidatePath("/crm/deals")
    return { success: true, data: deal }
  } catch (error) {
    console.error("Failed to create deal:", error)
    return { success: false, error: "Failed to create deal" }
  }
}
