"use server"

import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { cookies } from "next/headers"

export async function getSubAccounts() {
  try {
    const session = await getAuthSession()
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
    if (subAgencyId) {
      cookies().set("activeSubAccountId", subAgencyId, { path: "/" })
    } else {
      cookies().delete("activeSubAccountId")
    }
    return { success: true }
  } catch (error) {
    console.error("Failed to set subaccount cookie", error)
    return { success: false }
  }
}

export async function getActiveSubAccountId() {
  const cookieStore = cookies()
  const activeId = cookieStore.get("activeSubAccountId")
  return activeId?.value || null
}
