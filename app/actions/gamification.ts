"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function awardMemberBadge(contactId: string, badgeName: string, points = 50) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const badge = await db.snapshot.create({
      data: {
        agencyId: auth.agencyId,
        name: `Badge - ${badgeName}`,
        version: "community_badge",
        description: JSON.stringify({
          contactId,
          badgeName,
          points,
          awardedAt: new Date().toISOString()
        })
      }
    })

    revalidatePath("/support")
    return { success: true, badge }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
