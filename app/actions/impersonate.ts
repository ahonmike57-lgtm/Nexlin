"use server"

import { getSession } from "@/lib/auth"
import { requirePlatformAuth, logImpersonationStart } from "@/lib/permissions"
import { db } from "@/lib/db"

export async function startImpersonation(agencyId: string, reason?: string) {
  try {
    // Only owner, developer, and support roles can impersonate
    const auth = await requirePlatformAuth(["owner", "developer", "support"])
    if (!auth.authorized) {
      return { success: false, error: auth.error }
    }

    // Confirm target agency exists
    const agency = await db.agency.findUnique({
      where: { id: agencyId },
      select: { id: true, name: true }
    })

    if (!agency) {
      return { success: false, error: "Forbidden" }
    }

    // Log impersonation event to audit trail
    const log = await logImpersonationStart({
      adminId: auth.admin.id,
      adminEmail: auth.admin.email,
      adminRole: auth.admin.role,
      agencyId: agency.id,
      reason: reason || `Impersonated agency ${agency.name}`
    })

    return {
      success: true,
      impersonateAgencyId: agency.id,
      logId: log?.id || null
    }
  } catch (error: any) {
    console.error("Start impersonation error:", error)
    return { success: false, error: "Forbidden" }
  }
}

export async function stopImpersonation(logId?: string) {
  try {
    const session = await getSession()
    const user = session?.user as any
    if (!user?.isPlatformAdmin || !user?.id) {
      return { success: false, error: "Forbidden" }
    }

    const admin = await db.platformAdmin.findUnique({
      where: { id: user.id },
      select: { status: true }
    })

    if (!admin || admin.status !== "active") {
      return { success: false, error: "Forbidden" }
    }

    if (logId) {
      await db.impersonationLog.updateMany({
        where: { id: logId, adminId: user.id },
        data: { endedAt: new Date() }
      })
    }
    return { success: true }
  } catch (error: any) {
    console.error("Stop impersonation error:", error)
    return { success: false, error: "Forbidden" }
  }
}
