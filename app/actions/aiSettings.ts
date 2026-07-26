"use server"

import { db } from "@/lib/db"
import { getOrCreateAgency } from "./agency"
import { requireTenantAuth } from "@/lib/permissions"
import { encryptConfig, decryptConfig } from "@/lib/encryption"
import { revalidatePath } from "next/cache"

export async function getAiSettings() {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const settings = await db.aiSettings.findMany({
      where: { agencyId: auth.agencyId }
    })

    // Mask API keys before returning to client — decrypt only for display masking
    const masked = settings.map(s => ({
      ...s,
      apiKey: s.apiKey ? "••••••••" + decryptConfig(s.apiKey).slice(-4) : "••••••••"
    }))

    return { success: true, settings: masked }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function saveAiSetting(
  provider: string,
  apiKey: string,
  modelName: string,
  isActive: boolean = false
) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const agencyId = auth.agencyId

    // Encrypt API key at rest using AES-256-GCM before storing
    const encryptedKey = encryptConfig(apiKey)

    if (isActive) {
      await db.aiSettings.updateMany({
        where: { agencyId },
        data: { isActive: false }
      })
    }

    const setting = await db.aiSettings.upsert({
      where: { agencyId_provider: { agencyId, provider } },
      update: { apiKey: encryptedKey, modelName, isActive },
      create: { agencyId, provider, apiKey: encryptedKey, modelName, isActive }
    })

    revalidatePath("/settings/ai")
    return { success: true, setting }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Internal-only: decrypt and return a live API key for server-side AI calls.
 * NEVER returns this to the client.
 */
export async function getDecryptedAiKey(agencyId: string): Promise<string | null> {
  try {
    const setting = await db.aiSettings.findFirst({
      where: { agencyId, isActive: true }
    })
    if (!setting?.apiKey) return null
    return decryptConfig(setting.apiKey)
  } catch {
    return null
  }
}
