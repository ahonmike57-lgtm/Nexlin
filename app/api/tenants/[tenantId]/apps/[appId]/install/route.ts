import { db } from "@/lib/db"
import { encryptConfig } from "@/lib/encryption"
import { requirePlatformAuth, requireTenantAuth } from "@/lib/permissions"
import { NextResponse } from "next/server"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tenantId: string; appId: string }> }
) {
  try {
    const { tenantId, appId } = await params

    const tenantAuth = await requireTenantAuth("admin")
    const isAuthorizedTenantAdmin = tenantAuth.authorized && tenantAuth.agencyId === tenantId

    let actorId = tenantAuth.authorized ? tenantAuth.userId : null
    if (!isAuthorizedTenantAdmin) {
      const platformAuth = await requirePlatformAuth(["owner", "developer"])
      if (platformAuth.authorized) {
        actorId = platformAuth.admin.id
      }
    }

    if (!actorId) {
      return NextResponse.json(
        { error: "Forbidden: Tenant admin or platform admin privileges required" },
        { status: 403 }
      )
    }

    const app = await db.app.findUnique({
      where: { id: appId },
    })

    if (!app) {
      return NextResponse.json({ error: "App not found in catalog" }, { status: 404 })
    }

    const body = await req.json()
    const rawConfig = body.config || {}

    if (app.configSchema) {
      try {
        const schema = JSON.parse(app.configSchema)
        const requiredKeys = Object.keys(schema)
        for (const key of requiredKeys) {
          if (!(key in rawConfig)) {
            return NextResponse.json(
              { error: `Missing required config field: ${key}` },
              { status: 400 }
            )
          }
        }
      } catch (e) {
        console.warn("Invalid app.configSchema format, skipping key validation:", e)
      }
    }

    const encryptedConfig = encryptConfig(JSON.stringify(rawConfig))

    const tenantApp = await db.tenantApp.create({
      data: {
        agencyId: tenantId,
        appId: appId,
        config: encryptedConfig,
        installedBy: actorId,
        status: "active",
      },
    })

    return NextResponse.json({ success: true, installId: tenantApp.id })
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "App is already installed for this tenant" },
        { status: 409 }
      )
    }
    console.error("Failed to install app:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
