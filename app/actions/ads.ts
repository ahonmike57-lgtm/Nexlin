"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

function sanitizeAdCampaignData(data: any) {
  const clean: Record<string, any> = {}
  if (typeof data?.name === "string") clean.name = data.name.trim()
  if (typeof data?.platform === "string") clean.platform = data.platform.trim()
  if (typeof data?.status === "string") clean.status = data.status.trim()
  if (typeof data?.budget === "number" && Number.isFinite(data.budget)) clean.budget = data.budget
  if (typeof data?.spend === "number" && Number.isFinite(data.spend)) clean.spend = data.spend
  if (typeof data?.impressions === "number" && Number.isFinite(data.impressions)) clean.impressions = Math.trunc(data.impressions)
  if (typeof data?.clicks === "number" && Number.isFinite(data.clicks)) clean.clicks = Math.trunc(data.clicks)
  if (typeof data?.conversions === "number" && Number.isFinite(data.conversions)) clean.conversions = Math.trunc(data.conversions)
  return clean
}

export async function getAdCampaigns(_agencyId?: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const campaigns = await db.adCampaign.findMany({
      where: { agencyId: auth.agencyId },
      orderBy: { createdAt: "desc" }
    })
    return { success: true, campaigns }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createAdCampaign(_agencyId: string, data: any) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const cleanData = sanitizeAdCampaignData(data)
    if (!cleanData.name || !cleanData.platform) {
      return { success: false, error: "Campaign name and platform are required" }
    }

    const campaign = await db.adCampaign.create({
      data: {
        name: cleanData.name,
        platform: cleanData.platform,
        status: cleanData.status || "active",
        budget: cleanData.budget ?? 0,
        spend: cleanData.spend ?? 0,
        impressions: cleanData.impressions ?? 0,
        clicks: cleanData.clicks ?? 0,
        conversions: cleanData.conversions ?? 0,
        agencyId: auth.agencyId,
      }
    })
    revalidatePath("/ads")
    return { success: true, campaign }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateAdCampaign(id: string, data: any) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const existing = await db.adCampaign.findFirst({
      where: { id, agencyId: auth.agencyId },
      select: { id: true }
    })

    if (!existing) {
      return { success: false, error: "Campaign not found" }
    }

    const cleanData = sanitizeAdCampaignData(data)
    const campaign = await db.adCampaign.update({
      where: { id: existing.id },
      data: cleanData
    })
    revalidatePath("/ads")
    return { success: true, campaign }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
