import { db } from "@/lib/db"
import { requirePlatformAuth } from "@/lib/permissions"
import { NextResponse } from "next/server"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const auth = await requirePlatformAuth(["owner", "developer", "support"])
    if (!auth.authorized) {
      return NextResponse.json({ error: "Forbidden: Not an authorized platform admin" }, { status: 403 })
    }

    const { tenantId } = await params
    const tenant = await db.agency.findUnique({
      where: { id: tenantId },
    })

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    await db.auditLog.create({
      data: {
        userId: auth.admin.id,
        action: "IMPERSONATE",
        entity: "Tenant",
        entityId: tenant.id,
        details: JSON.stringify({ adminRole: auth.role }),
      },
    })

    return NextResponse.json({ success: true, message: "Impersonation authorized" })
  } catch (error: any) {
    console.error("Impersonation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
