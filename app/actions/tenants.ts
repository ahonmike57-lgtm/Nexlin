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

    // Generate a one-time temporary password — returned once to the Platform Owner
    // New tenant must change it on first login via the forgot-password flow
    const crypto = (await import("crypto")).default
    const bcrypt = (await import("bcryptjs")).default
    const tempPassword = crypto.randomBytes(10).toString("hex") // 20-char hex
    const passwordHash = await bcrypt.hash(tempPassword, 12)

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
            passwordHash,
          }
        }
      }
    })

    revalidatePath("/platform/tenants")
    return { success: true, agency, tempPassword }
  } catch (error: any) {
    console.error("Create tenant error:", error)
    return { success: false, error: error.message || "Failed to create tenant" }
  }
}

export async function reassignTenantAdmin(data: {
  agencyId: string
  newAdminEmail: string
  newAdminName: string
  reason: string
}) {
  try {
    // Break-glass: OWNER ONLY. Support cannot reassign without an Owner performing this action.
    const auth = await requirePlatformAuth(["owner"])
    if (!auth.authorized) {
      return { success: false, error: auth.error }
    }

    const cleanEmail = data.newAdminEmail.trim().toLowerCase()
    if (!cleanEmail || !data.reason.trim()) {
      return { success: false, error: "New admin email and justification reason are required." }
    }

    const agency = await db.agency.findUnique({
      where: { id: data.agencyId }
    })

    if (!agency) {
      return { success: false, error: "Tenant agency not found." }
    }

    // 1. Audit Log Break-Glass Action
    await db.impersonationLog.create({
      data: {
        adminId: auth.admin.id,
        adminEmail: auth.admin.email,
        adminRole: auth.role,
        agencyId: agency.id,
        reason: `[BREAK-GLASS ADMIN REASSIGNMENT] Reassigned owner to ${cleanEmail}. Justification: ${data.reason.trim()}`
      }
    })

    // 2. Check if user already exists for this email
    let user = await db.user.findUnique({ where: { email: cleanEmail } })

    if (user) {
      // Elevate existing user to Agency Owner and link to this tenant agency
      await db.user.update({
        where: { id: user.id },
        data: {
          agencyId: agency.id,
          role: "Agency Owner",
          name: data.newAdminName.trim() || user.name
        }
      })
    } else {
      // Create new Agency Owner user
      await db.user.create({
        data: {
          email: cleanEmail,
          name: data.newAdminName.trim() || "Agency Owner",
          role: "Agency Owner",
          agencyId: agency.id
        }
      })
    }

    revalidatePath("/platform/tenants")
    return { success: true }
  } catch (error: any) {
    console.error("Reassign tenant admin error:", error)
    return { success: false, error: error.message || "Failed to reassign tenant admin" }
  }
}
