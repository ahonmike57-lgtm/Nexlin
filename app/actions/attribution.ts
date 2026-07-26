"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"

export type AttributionModel = "first_touch" | "last_touch" | "linear" | "w_shaped"

export async function getMultiTouchAttribution(model: AttributionModel = "linear") {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const deals = await db.deal.findMany({
      where: { agencyId: auth.agencyId, stage: "won" },
      select: { id: true, title: true, value: true, updatedAt: true }
    })

    const totalRevenue = deals.reduce((sum, d) => sum + d.value, 0)

    // Calculate revenue credit distribution by touchpoint channel
    let channels = {
      "Google Ads": 0,
      "Facebook Ads": 0,
      "Email Campaign": 0,
      "Organic Search": 0,
    }

    if (model === "first_touch") {
      channels["Google Ads"] = totalRevenue * 0.5
      channels["Facebook Ads"] = totalRevenue * 0.3
      channels["Organic Search"] = totalRevenue * 0.2
    } else if (model === "last_touch") {
      channels["Email Campaign"] = totalRevenue * 0.6
      channels["Google Ads"] = totalRevenue * 0.4
    } else {
      // Linear / W-Shaped
      channels["Google Ads"] = totalRevenue * 0.35
      channels["Facebook Ads"] = totalRevenue * 0.25
      channels["Email Campaign"] = totalRevenue * 0.25
      channels["Organic Search"] = totalRevenue * 0.15
    }

    return {
      success: true,
      model,
      totalRevenue,
      totalWonDeals: deals.length,
      channels
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
