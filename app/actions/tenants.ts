"use server"

import { db } from "@/lib/db"
import { requirePlatformAuth } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function getTenants() {
  try {
    const auth = await requirePlatformAuth(["owner", "developer", "support"])
    if (!auth.authorized) {
      return { success: false, error: auth.error }
    }

    const tenants = await db.agency.findMany({
      include: {
        users: { select: { id: true, email: true, name: true, role: true } },
        _count: { select: { contacts: true, deals: true, users: true } }
      },
      orderBy: { createdAt: "desc" }
    })

    return { success: true, tenants }
  } catch (error: any) {
    console.error("Get tenants error:", error)
    return { success: false, error: "Forbidden" }
  }
}

export async function updateTenantStatus(agencyId: string, status: string) {
  try {
    // Only Platform Owner can mutate tenant status (suspend, activate)
    const auth = await requirePlatformAuth(["owner"])
    if (!auth.authorized) {
      return { success: false, error: auth.error }
    }

    const agency = await db.agency.update({
      where: { id: agencyId },
      data: { status }
    })

    revalidatePath("/platform/tenants")
    return { success: true, agency }
  } catch (error: any) {
    console.error("Update tenant status error:", error)
    return { success: false, error: "Forbidden" }
  }
}

export async function updateTenantPlanTier(agencyId: string, planTier: string) {
  try {
    // Only Platform Owner can mutate tenant billing / plan tier
    const auth = await requirePlatformAuth(["owner"])
    if (!auth.authorized) {
      return { success: false, error: auth.error }
    }

    const agency = await db.agency.update({
      where: { id: agencyId },
      data: { planTier }
    })

    revalidatePath("/platform/tenants")
    return { success: true, agency }
  } catch (error: any) {
    console.error("Update tenant plan tier error:", error)
    return { success: false, error: "Forbidden" }
  }
}

export async function createTenant(data: {
  name: string
  subdomain: string
  planTier: string
  ownerEmail: string
  ownerName: string
}) {
  try {
    const auth = await requirePlatformAuth(["owner"])
    if (!auth.authorized) {
      return { success: false, error: auth.error }
    }

    const cleanSubdomain = data.subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, "")
    const cleanEmail = data.ownerEmail.trim().toLowerCase()

    if (!cleanSubdomain || !cleanEmail || !data.name.trim()) {
      return { success: false, error: "Name, subdomain, and owner email are required." }
    }

    const existingAgency = await db.agency.findUnique({
      where: { subdomain: cleanSubdomain }
    })

    if (existingAgency) {
      return { success: false, error: "A tenant with this subdomain already exists." }
    }

    let platform = await db.platform.findFirst()
    if (!platform) {
      platform = await db.platform.create({ data: { name: "NEXLIN GHL" } })
    }

    const agency = await db.agency.create({
      data: {
        platformId: platform.id,
        name: data.name.trim(),
        subdomain: cleanSubdomain,
        planTier: data.planTier || "basic",
        status: "active",
        users: {
          create: {
            email: cleanEmail,
            name: data.ownerName.trim() || "Agency Owner",
            role: "Agency Owner",
          }
        }
      }
    })

    revalidatePath("/platform/tenants")
    return { success: true, agency }
  } catch (error: any) {
    console.error("Create tenant error:", error)
    return { success: false, error: error.message || "Failed to create tenant" }
  }
}
