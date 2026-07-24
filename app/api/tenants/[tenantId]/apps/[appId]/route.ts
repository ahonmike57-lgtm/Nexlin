import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { encryptConfig } from "@/lib/encryption"
import { NextResponse } from "next/server"

// Updates the configuration of an installed app
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ tenantId: string, appId: string }> }
) {
  try {
    const session = await getSession()
    const isPlatformAdmin = (session?.user as any)?.isPlatformAdmin
    const userAgencyId = (session?.user as any)?.agencyId

    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { tenantId, appId } = await params

    if (!isPlatformAdmin && userAgencyId !== tenantId) {
       return NextResponse.json({ error: "Forbidden: Cannot update apps for other tenants" }, { status: 403 })
    }

    const body = await req.json()
    const rawConfig = body.config || {}
    const encryptedConfig = encryptConfig(JSON.stringify(rawConfig))

    const tenantApp = await db.tenantApp.update({
      where: {
        agencyId_appId: {
          agencyId: tenantId,
          appId: appId
        }
      },
      data: {
        config: encryptedConfig,
        status: "active" // Re-activate if it was disabled
      }
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
  { params }: { params: Promise<{ tenantId: string, appId: string }> }
) {
  try {
    const session = await getSession()
    const isPlatformAdmin = (session?.user as any)?.isPlatformAdmin
    const userAgencyId = (session?.user as any)?.agencyId

    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { tenantId, appId } = await params

    if (!isPlatformAdmin && userAgencyId !== tenantId) {
       return NextResponse.json({ error: "Forbidden: Cannot uninstall apps for other tenants" }, { status: 403 })
    }

    // Rather than hard delete, we set status to disabled to preserve history
    await db.tenantApp.update({
      where: {
        agencyId_appId: {
          agencyId: tenantId,
          appId: appId
        }
      },
      data: {
        status: "disabled"
      }
    })

    return NextResponse.json({ success: true, message: "App uninstalled successfully" })
  } catch (error: any) {
    console.error("Failed to uninstall app:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
