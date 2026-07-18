"use server"

import { db } from "@/lib/db"
import { getOrCreateAgency } from "./agency"
import { getSession } from "@/lib/auth"

export async function getAiSettings() {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const agencyId = await getOrCreateAgency()
    
    const settings = await db.aiSettings.findMany({
      where: { agencyId }
    })
    
    return { success: true, settings }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function saveAiSetting(provider: string, apiKey: string, modelName: string, isActive: boolean = false) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const agencyId = await getOrCreateAgency()
    
    // If setting this one to active, we might want to set others to inactive
    if (isActive) {
      await db.aiSettings.updateMany({
        where: { agencyId },
        data: { isActive: false }
      })
    }

    const setting = await db.aiSettings.upsert({
      where: {
        agencyId_provider: {
          agencyId,
          provider
        }
      },
      update: {
        apiKey,
        modelName,
        isActive
      },
      create: {
        agencyId,
        provider,
        apiKey,
        modelName,
        isActive
      }
    })

    return { success: true, setting }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
