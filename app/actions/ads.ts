"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getAdCampaigns(agencyId: string) {
  try {
    const campaigns = await db.adCampaign.findMany({
      where: { agencyId },
      orderBy: { createdAt: "desc" }
    })
    return { success: true, campaigns }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createAdCampaign(agencyId: string, data: any) {
  try {
    const campaign = await db.adCampaign.create({
      data: {
        ...data,
        agencyId,
      }
    })
    revalidatePath("/ads")
    return { success: true, campaign }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateAdCampaign(id: string, data: any) {
  try {
    const campaign = await db.adCampaign.update({
      where: { id },
      data
    })
    revalidatePath("/ads")
    return { success: true, campaign }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
