"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"

export async function logTenantActivity(action: string, entityType: string, entityId?: string, details?: string) {
  try {
    const auth = await requireTenantAuth("user")
    if (!auth.authorized || !auth.agencyId) return

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action,
        entityType,
        entityId: entityId || null,
        details: details || null,
      }
    })
  } catch (e) {
    console.error("Log tenant activity error:", e)
  }
}

export async function getTenantAuditLogs() {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const logs = await db.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, role: true } }
      }
    })

    return { success: true, logs }
  } catch (error: any) {
    console.error("Get tenant audit logs error:", error)
    return { success: false, error: "Failed to fetch audit logs" }
  }
}
