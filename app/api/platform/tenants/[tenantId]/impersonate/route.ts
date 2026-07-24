import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const session = await getSession()

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { isPlatformAdmin, role } = session.user as any

    if (!isPlatformAdmin) {
      return NextResponse.json({ error: "Forbidden: Not a platform admin" }, { status: 403 })
    }

    if (role !== "owner" && role !== "developer" && role !== "support") {
      return NextResponse.json({ error: "Forbidden: Insufficient role" }, { status: 403 })
    }

    const { tenantId } = await params
    const tenant = await db.agency.findUnique({
      where: { id: tenantId }
    })

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    // In a real implementation, you might create an AuditLog here to track who impersonated who and when.
    await db.auditLog.create({
      data: {
        userId: session.user.id, // The platform admin's ID
        action: "IMPERSONATE",
        entity: "Tenant",
        entityId: tenant.id,
        details: JSON.stringify({ adminRole: role })
      }
    })

    // To actually trigger impersonation in NextAuth, the frontend will need to call `update({ impersonateAgencyId: params.tenantId })`
    // This API route serves as the permission gate and audit log creation step before the frontend performs the session update.
    
    return NextResponse.json({ success: true, message: "Impersonation authorized" })
  } catch (error: any) {
    console.error("Impersonation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
