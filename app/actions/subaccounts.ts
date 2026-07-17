"use server"

import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function getSubAccounts() {
  try {
    const session = await getSession()
    if (!session?.user?.email) return []

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { agency: { include: { subAgencies: true } } }
    })

    if (!user || !user.agency) return []
    
    return user.agency.subAgencies
  } catch (error) {
    console.error("Failed to fetch subaccounts", error)
    return []
  }
}

export async function setActiveSubAccount(subAgencyId: string | null) {
  try {
    const cookieStore = await cookies()
    if (subAgencyId) {
      cookieStore.set("activeSubAccountId", subAgencyId, { path: "/" })
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

export async function createSubAccount(agencyId: string, name: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const sub = await db.subAgency.create({
      data: { 
        agencyId, 
        name,
        email: `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com` // Mock email for creation
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
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    await db.subAgency.delete({
      where: { id: subAgencyId }
    })

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
