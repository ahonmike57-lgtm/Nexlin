"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function getSubAccounts() {
  try {
    const auth = await requireTenantAuth("user")
    if (!auth.authorized || !auth.agencyId) return []

    return await db.subAgency.findMany({
      where: { agencyId: auth.agencyId },
      orderBy: { createdAt: "desc" }
    })
  } catch (error) {
    console.error("Failed to fetch subaccounts", error)
    return []
  }
}

export async function setActiveSubAccount(subAgencyId: string | null) {
  try {
    const auth = await requireTenantAuth("user")
    if (!auth.authorized || !auth.agencyId) {
      return { success: false, error: "Unauthorized" }
    }

    const cookieStore = await cookies()
    if (subAgencyId) {
      const owned = await db.subAgency.findFirst({
        where: { id: subAgencyId, agencyId: auth.agencyId },
        select: { id: true }
      })
      if (!owned) {
        return { success: false, error: "Sub-account not found" }
      }

      cookieStore.set("activeSubAccountId", owned.id, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      })
    } else {
      cookieStore.delete("activeSubAccountId")
    }
    return { success: true }
  } catch (error) {
    console.error("Failed to set subaccount cookie", error)
    return { success: false }
  }
}

export async function getActiveSubAccountId() {
  const cookieStore = await cookies()
  const activeId = cookieStore.get("activeSubAccountId")
  return activeId?.value || null
}

export async function createSubAccount(_agencyId: string, name: string) {
  try {
    const auth = await requireTenantAuth("admin")
    if (!auth.authorized || !auth.agencyId) {
      return { success: false, error: auth.error || "Unauthorized" }
    }

    const cleanName = name?.trim()
    if (!cleanName) {
      return { success: false, error: "Sub-account name is required" }
    }

    const sub = await db.subAgency.create({
      data: { 
        agencyId: auth.agencyId, 
        name: cleanName,
        email: `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'subaccount'}@example.com`
      }
    })

    revalidatePath("/settings/sub-accounts")
    return { success: true, data: sub }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteSubAccount(subAgencyId: string) {
  try {
    const auth = await requireTenantAuth("admin")
    if (!auth.authorized || !auth.agencyId) {
      return { success: false, error: auth.error || "Unauthorized" }
    }

    const deleted = await db.subAgency.deleteMany({
      where: { 
        id: subAgencyId,
        agencyId: auth.agencyId
      }
    })

    if (deleted.count === 0) {
      return { success: false, error: "Sub-account not found" }
    }

    // Also clear cookie if this was the active sub-account
    const cookieStore = await cookies()
    if (cookieStore.get("activeSubAccountId")?.value === subAgencyId) {
      cookieStore.delete("activeSubAccountId")
    }

    revalidatePath("/settings/sub-accounts")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
