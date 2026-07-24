"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function installApp(agencyId: string, appId: string, config?: any) {
  try {
    const install = await db.tenantApp.create({
      data: {
        agencyId,
        appId,
        config: config ? JSON.stringify(config) : undefined
      }
    })
    revalidatePath("/marketplace")
    return { success: true, install }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function uninstallApp(agencyId: string, appId: string) {
  try {
    await db.tenantApp.deleteMany({
      where: {
        agencyId,
        appId
      }
    })
    revalidatePath("/marketplace")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
