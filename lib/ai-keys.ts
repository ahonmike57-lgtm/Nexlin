import "server-only"
import { db } from "@/lib/db"
import { decryptConfig } from "@/lib/encryption"

/**
 * Server-only helper to decrypt and return an agency's active AI API key.
 * Never re-export from a `"use server"` module.
 */
export async function getDecryptedAiKey(agencyId: string): Promise<string | null> {
  try {
    const setting = await db.aiSettings.findFirst({
      where: { agencyId, isActive: true },
    })
    if (!setting?.apiKey) return null
    const decrypted = decryptConfig(setting.apiKey)
    return decrypted || null
  } catch {
    return null
  }
}
