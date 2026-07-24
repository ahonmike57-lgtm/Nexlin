import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const session = await getSession()
    
    // Strict Tenancy Scoping: Ensure the user belongs to the tenant they are querying, 
    // or they are a Platform Admin.
    const isPlatformAdmin = (session?.user as any)?.isPlatformAdmin
    const userAgencyId = (session?.user as any)?.agencyId
    const isImpersonating = (session?.user as any)?.isImpersonating

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tenantId } = await params

    if (!isPlatformAdmin && userAgencyId !== tenantId) {
       return NextResponse.json({ error: "Forbidden: Cannot access other tenants" }, { status: 403 })
    }

    const tenantApps = await db.tenantApp.findMany({
      where: { agencyId: tenantId },
      include: {
        app: true
      }
    })

    // Mask the encrypted config before returning to the client
    const safeTenantApps = tenantApps.map(ta => ({
      ...ta,
      config: ta.config ? "***ENCRYPTED***" : null
    }))

    return NextResponse.json({ success: true, installs: safeTenantApps })
  } catch (error: any) {
    console.error("Failed to fetch tenant apps:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
