"use server"

import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

const DEFAULT_FLAGS = [
  {
    key: "voice_ai",
    name: "Voice AI Agents",
    description: "Deploy autonomous ElevenLabs/Twilio voice calling agents",
    enabledTiers: "pro,enterprise",
    isEnabledGlobal: true,
  },
  {
    key: "affiliate_manager",
    name: "Affiliate Manager",
    description: "Affiliate portal, tracking links, and commission payout engine",
    enabledTiers: "pro,enterprise",
    isEnabledGlobal: true,
  },
  {
    key: "social_planner",
    name: "Social Media Planner",
    description: "Multi-channel social post scheduler and content calendar",
    enabledTiers: "basic,pro,enterprise",
    isEnabledGlobal: true,
  },
  {
    key: "ads_manager",
    name: "Ads Campaign Manager",
    description: "Google & Meta ad campaign analytics and tracking",
    enabledTiers: "pro,enterprise",
    isEnabledGlobal: true,
  },
  {
    key: "mcp_integrations",
    name: "MCP App Marketplace",
    description: "Model Context Protocol & third-party SaaS integrations",
    enabledTiers: "basic,pro,enterprise",
    isEnabledGlobal: true,
  },
  {
    key: "reputation",
    name: "Reputation Management",
    description: "Google & Facebook review request automation & widget",
    enabledTiers: "basic,pro,enterprise",
    isEnabledGlobal: true,
  },
]

export async function getFeatureFlags() {
  try {
    let flags = await db.featureFlag.findMany({
      orderBy: { key: "asc" }
    })

    // Seed defaults if table is empty
    if (flags.length === 0) {
      await db.featureFlag.createMany({
        data: DEFAULT_FLAGS,
        skipDuplicates: true,
      })
      flags = await db.featureFlag.findMany({ orderBy: { key: "asc" } })
    }

    return { success: true, flags }
  } catch (error: any) {
    console.error("Get feature flags error:", error)
    return { success: false, flags: [], error: error.message }
  }
}

export async function updateFeatureFlag(data: {
  key: string
  isEnabledGlobal?: boolean
  enabledTiers?: string
}) {
  try {
    const session = await getSession()
    if (!session || !session.user || !(session.user as any).isPlatformAdmin) {
      return { success: false, error: "Unauthorized. Platform admin access required." }
    }

    const flag = await db.featureFlag.update({
      where: { key: data.key },
      data: {
        ...(data.isEnabledGlobal !== undefined ? { isEnabledGlobal: data.isEnabledGlobal } : {}),
        ...(data.enabledTiers !== undefined ? { enabledTiers: data.enabledTiers } : {}),
      }
    })

    revalidatePath("/platform/features")
    revalidatePath("/dashboard")

    return { success: true, flag }
  } catch (error: any) {
    console.error("Update feature flag error:", error)
    return { success: false, error: error.message }
  }
}
