import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requirePlatformAuth } from "@/lib/permissions"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const auth = await requirePlatformAuth(["owner", "developer", "support"])
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 403 })
    }

    const [
      tenantsCount,
      adminsCount,
      impersonationLogs,
      usageLogs,
      webhooks,
      tenantApps
    ] = await Promise.all([
      db.agency.count(),
      db.platformAdmin.count({ where: { status: "active" } }),
      db.impersonationLog.findMany({
        take: 25,
        orderBy: { startedAt: "desc" },
        include: { agency: { select: { name: true, subdomain: true } } }
      }),
      db.usageLog.findMany({
        take: 25,
        orderBy: { createdAt: "desc" }
      }),
      db.webhook.findMany({
        take: 25,
        orderBy: { createdAt: "desc" }
      }),
      db.tenantApp.findMany({
        take: 25,
        orderBy: { installedAt: "desc" },
        include: { app: true }
      })
    ])

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      callerRole: auth.role,
      systemMetrics: {
        totalTenants: tenantsCount,
        activePlatformAdmins: adminsCount,
      },
      auditLogs: {
        impersonationLogs,
        usageLogs,
        webhooks,
        tenantApps
      }
    })
  } catch (error: any) {
    console.error("API Debug error:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}
