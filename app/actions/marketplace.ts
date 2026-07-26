"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function installApp(appId: string, config?: any) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const install = await db.tenantApp.create({
      data: {
        agencyId: auth.agencyId,          // always from session, never from client
        appId,
        installedBy: auth.userId,
        config: config ? JSON.stringify(config) : undefined
      }
    })
    revalidatePath("/marketplace")
    return { success: true, install }
  } catch (error: any) {
    // Unique constraint = already installed
    if (error.code === "P2002") {
      return { success: false, error: "App is already installed." }
    }
    return { success: false, error: error.message }
  }
}

export async function uninstallApp(appId: string) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    await db.tenantApp.deleteMany({
      where: {
        agencyId: auth.agencyId,          // always from session — prevents cross-tenant uninstall
        appId
      }
    })
    revalidatePath("/marketplace")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
