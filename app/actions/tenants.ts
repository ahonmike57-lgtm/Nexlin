"use server"

import { db } from "@/lib/db"
import { requirePlatformAuth } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function getTenants() {
  try {
    const auth = await requirePlatformAuth(["owner", "developer", "support"])
    if (!auth.authorized) {
      return { success: false, error: auth.error }
    }

    const tenants = await db.agency.findMany({
      include: {
        users: { select: { id: true, email: true, name: true, role: true } },
        _count: { select: { contacts: true, deals: true, users: true } }
      },
      orderBy: { createdAt: "desc" }
    })

    return { success: true, tenants }
  } catch (error: any) {
    console.error("Get tenants error:", error)
    return { success: false, error: "Forbidden" }
  }
}

export async function updateTenantStatus(agencyId: string, status: string) {
  try {
    // Only Platform Owner can mutate tenant status (suspend, activate)
    const auth = await requirePlatformAuth(["owner"])
    if (!auth.authorized) {
      return { success: false, error: auth.error }
    }

    const agency = await db.agency.update({
      where: { id: agencyId },
      data: { status }
    })

    revalidatePath("/platform/tenants")
    return { success: true, agency }
  } catch (error: any) {
    console.error("Update tenant status error:", error)
    return { success: false, error: "Forbidden" }
  }
}

export async function updateTenantPlanTier(agencyId: string, planTier: string) {
  try {
    // Only Platform Owner can mutate tenant billing / plan tier
    const auth = await requirePlatformAuth(["owner"])
    if (!auth.authorized) {
      return { success: false, error: auth.error }
    }

    const agency = await db.agency.update({
      where: { id: agencyId },
      data: { planTier }
    })

    revalidatePath("/platform/tenants")
    return { success: true, agency }
  } catch (error: any) {
    console.error("Update tenant plan tier error:", error)
    return { success: false, error: "Forbidden" }
  }
}
