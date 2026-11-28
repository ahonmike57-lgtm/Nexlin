import { db } from "@/lib/db"
import { requirePlatformAuth, requireTenantAuth } from "@/lib/permissions"
import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params

    const tenantAuth = await requireTenantAuth("user")
    const isAuthorizedTenantUser = tenantAuth.authorized && tenantAuth.agencyId === tenantId

    let isAuthorizedPlatformAdmin = false
    if (!isAuthorizedTenantUser) {
      const platformAuth = await requirePlatformAuth(["owner", "developer", "support"])
      isAuthorizedPlatformAdmin = platformAuth.authorized
    }

    if (!isAuthorizedTenantUser && !isAuthorizedPlatformAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Cannot access other tenants" },
        { status: 403 }
      )
    }

    const tenantApps = await db.tenantApp.findMany({
      where: { agencyId: tenantId },
      include: {
        app: true,
      },
    })

    // Mask the encrypted config before returning to the client
    const safeTenantApps = tenantApps.map((ta) => ({
      ...ta,
      config: ta.config ? "***ENCRYPTED***" : null,
    }))

    return NextResponse.json({ success: true, installs: safeTenantApps })
  } catch (error: any) {
    console.error("Failed to fetch tenant apps:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
