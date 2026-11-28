"use server"

import { db } from "@/lib/db"
import { requirePlatformAuth } from "@/lib/permissions"

function csvCell(val: unknown): string {
  const str = String(val ?? "")
  const neutralized = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str
  return `"${neutralized.replace(/"/g, '""')}"`
}

export async function getSystemDebugLogs() {
  try {
    const auth = await requirePlatformAuth(["owner", "developer"])
    if (!auth.authorized) {
      return { success: false, error: auth.error }
    }

    const [impersonationLogs, usageLogs, webhooks, rawTenantApps] = await Promise.all([
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

    const tenantApps = rawTenantApps.map((ta) => ({
      ...ta,
      config: ta.config ? "***ENCRYPTED***" : null,
    }))

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
    const auth = await requirePlatformAuth(["owner", "developer"])
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

    const sanitizedAgency = {
      ...agency,
      aiSettings: agency.aiSettings.map((s) => ({
        ...s,
        apiKey: s.apiKey ? "••••••••" : "••••••••",
      })),
      tenantApps: agency.tenantApps.map((ta) => ({
        ...ta,
        config: ta.config ? "***ENCRYPTED***" : null,
      })),
    }

    return { success: true, agency: sanitizedAgency }
  } catch (error: any) {
    console.error("Get tenant inspection error:", error)
    return { success: false, error: "Forbidden" }
  }
}

export async function exportAuditLogs(logType: "impersonation" | "usage") {
  try {
    const auth = await requirePlatformAuth(["owner", "developer"])
    if (!auth.authorized) {
      return { success: false, error: auth.error }
    }

    if (logType === "impersonation") {
      const logs = await db.impersonationLog.findMany({
        orderBy: { startedAt: "desc" },
        take: 200,
        include: { agency: { select: { name: true, subdomain: true } } }
      })

      const csvHeader = "ID,Admin Email,Admin Role,Target Tenant,Started At,Ended At,Reason\n"
      const csvRows = logs.map(l =>
        [
          csvCell(l.id),
          csvCell(l.adminEmail),
          csvCell(l.adminRole),
          csvCell(l.agency?.name || l.agencyId),
          csvCell(l.startedAt.toISOString()),
          csvCell(l.endedAt ? l.endedAt.toISOString() : "Active"),
          csvCell(l.reason || ""),
        ].join(",")
      ).join("\n")

      return { success: true, csvContent: csvHeader + csvRows, filename: `impersonation_audit_${Date.now()}.csv` }
    } else {
      const logs = await db.usageLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 200
      })

      const csvHeader = "ID,Type,Amount,Base Cost,Markup,Description,Timestamp\n"
      const csvRows = logs.map(l =>
        [
          csvCell(l.id),
          csvCell(l.type),
          csvCell(l.amount),
          csvCell(l.cost),
          csvCell(l.markup),
          csvCell(l.description || ""),
          csvCell(l.createdAt.toISOString()),
        ].join(",")
      ).join("\n")

      return { success: true, csvContent: csvHeader + csvRows, filename: `usage_audit_${Date.now()}.csv` }
    }
  } catch (error: any) {
    console.error("Export audit logs error:", error)
    return { success: false, error: "Failed to export logs" }
  }
}
