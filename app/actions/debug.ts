"use server"

import { db } from "@/lib/db"
import { requirePlatformAuth } from "@/lib/permissions"

export async function getSystemDebugLogs() {
  try {
    const auth = await requirePlatformAuth(["owner", "developer", "support"])
    if (!auth.authorized) {
      return { success: false, error: auth.error }
    }

    const [impersonationLogs, usageLogs, webhooks, tenantApps] = await Promise.all([
      db.impersonationLog.findMany({
        take: 50,
        orderBy: { startedAt: "desc" },
        include: { agency: { select: { name: true, subdomain: true } } }
      }),
      db.usageLog.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
        include: { wallet: { select: { agencyId: true, subAgencyId: true } } }
      }),
      db.webhook.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
        include: { agency: { select: { name: true } } }
      }),
      db.tenantApp.findMany({
        take: 50,
        orderBy: { installedAt: "desc" },
        include: { agency: { select: { name: true } }, app: true }
      })
    ])

    return {
      success: true,
      logs: {
        impersonationLogs,
        usageLogs,
        webhooks,
        tenantApps
      }
    }
  } catch (error: any) {
    console.error("Get system debug logs error:", error)
    return { success: false, error: "Forbidden" }
  }
}

export async function getTenantInspectionDetails(agencyId: string) {
  try {
    const auth = await requirePlatformAuth(["owner", "developer", "support"])
    if (!auth.authorized) {
      return { success: false, error: auth.error }
    }

    const agency = await db.agency.findUnique({
      where: { id: agencyId },
      include: {
        subAgencies: true,
        webhooks: true,
        tenantApps: { include: { app: true } },
        aiSettings: true,
        rebillingMarkups: true,
        users: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { contacts: true, deals: true, workflows: true, funnels: true } }
      }
    })

    if (!agency) {
      return { success: false, error: "Tenant not found" }
    }

    return { success: true, agency }
  } catch (error: any) {
    console.error("Get tenant inspection error:", error)
    return { success: false, error: "Forbidden" }
  }
}
