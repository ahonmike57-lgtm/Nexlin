"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function installExtension(agencyId: string, extensionId: string, config?: any) {
  try {
    const install = await db.extensionInstall.create({
      data: {
        agencyId,
        extensionId,
        config: config ? JSON.stringify(config) : undefined
      }
    })
    revalidatePath("/marketplace")
    return { success: true, install }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function uninstallExtension(agencyId: string, extensionId: string) {
  try {
    await db.extensionInstall.deleteMany({
      where: {
        agencyId,
        extensionId
      }
    })
    revalidatePath("/marketplace")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
