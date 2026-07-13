"use server"

import { db } from "@/lib/db"

export async function getAdCampaigns(agencyId: string) {
  try {
    const campaigns = await db.adCampaign.findMany({
      where: { agencyId },
      orderBy: {
        createdAt: "desc",
      },
    })
    return { success: true, campaigns }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
