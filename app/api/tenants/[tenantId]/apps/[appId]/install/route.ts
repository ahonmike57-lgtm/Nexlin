import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { encryptConfig } from "@/lib/encryption"
import { NextResponse } from "next/server"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tenantId: string, appId: string }> }
) {
  try {
    const session = await getSession()
    
    // Strict Tenancy Scoping
    const isPlatformAdmin = (session?.user as any)?.isPlatformAdmin
    const userAgencyId = (session?.user as any)?.agencyId

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tenantId, appId } = await params

    // Only allow Admins/Users of this specific tenant, or Platform Admins
    if (!isPlatformAdmin && userAgencyId !== tenantId) {
       return NextResponse.json({ error: "Forbidden: Cannot install apps for other tenants" }, { status: 403 })
    }

    const app = await db.app.findUnique({
      where: { id: appId }
    })

    if (!app) {
      return NextResponse.json({ error: "App not found in catalog" }, { status: 404 })
    }

    const body = await req.json()
    const rawConfig = body.config || {}

    // Mock Validation against configSchema 
    // In production, we'd use Zod or AJV to validate rawConfig against JSON.parse(app.configSchema)
    if (app.configSchema) {
       const requiredKeys = Object.keys(JSON.parse(app.configSchema))
       for (const key of requiredKeys) {
         if (!(key in rawConfig)) {
           return NextResponse.json({ error: `Missing required config field: ${key}` }, { status: 400 })
         }
       }
    }

    // Encrypt the config before it hits the database
    const encryptedConfig = encryptConfig(JSON.stringify(rawConfig))

    const tenantApp = await db.tenantApp.create({
      data: {
        agencyId: tenantId,
        appId: appId,
        config: encryptedConfig,
        installedBy: session.user.id,
        status: "active"
      }
    })

    return NextResponse.json({ success: true, installId: tenantApp.id })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "App is already installed for this tenant" }, { status: 409 })
    }
    console.error("Failed to install app:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
