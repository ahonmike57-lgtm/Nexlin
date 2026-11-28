import { db } from "@/lib/db"
import { encryptConfig } from "@/lib/encryption"
import { requirePlatformAuth, requireTenantAuth } from "@/lib/permissions"
import { NextResponse } from "next/server"

async function authorizeTenantAppWrite(tenantId: string): Promise<boolean> {
  const tenantAuth = await requireTenantAuth("admin")
  if (tenantAuth.authorized && tenantAuth.agencyId === tenantId) {
    return true
  }
  const platformAuth = await requirePlatformAuth(["owner", "developer"])
  return platformAuth.authorized
}

// Updates the configuration of an installed app
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ tenantId: string; appId: string }> }
) {
  try {
    const { tenantId, appId } = await params
    const allowed = await authorizeTenantAppWrite(tenantId)
    if (!allowed) {
      return NextResponse.json(
        { error: "Forbidden: Tenant admin or platform admin privileges required" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const rawConfig = body.config || {}
    const encryptedConfig = encryptConfig(JSON.stringify(rawConfig))

    const tenantApp = await db.tenantApp.update({
      where: {
        agencyId_appId: {
          agencyId: tenantId,
          appId: appId,
        },
      },
      data: {
        config: encryptedConfig,
        status: "active",
      },
    })

    return NextResponse.json({ success: true, installId: tenantApp.id })
  } catch (error: any) {
    console.error("Failed to update app:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Uninstalls (disables) an app
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ tenantId: string; appId: string }> }
) {
  try {
    const { tenantId, appId } = await params
    const allowed = await authorizeTenantAppWrite(tenantId)
    if (!allowed) {
      return NextResponse.json(
        { error: "Forbidden: Tenant admin or platform admin privileges required" },
        { status: 403 }
      )
    }

    await db.tenantApp.update({
      where: {
        agencyId_appId: {
          agencyId: tenantId,
          appId: appId,
        },
      },
      data: {
        status: "disabled",
      },
    })

    return NextResponse.json({ success: true, message: "App uninstalled successfully" })
  } catch (error: any) {
    console.error("Failed to uninstall app:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
