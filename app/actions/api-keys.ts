"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import crypto from "crypto"

export async function createApiKey(data: { name: string; scopes: string[] }) {
  const auth = await requireTenantAuth("tenant_admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const secretKey = `nx_live_${crypto.randomBytes(24).toString("hex")}`
    const keyPrefix = secretKey.slice(0, 15) + "..."
    const keyHash = crypto.createHash("sha256").update(secretKey).digest("hex")

    const apiKey = await db.apiKey.create({
      data: {
        name: data.name,
        keyPrefix,
        keyHash,
        scopes: data.scopes.join(","),
        agencyId: auth.agencyId,
        createdById: auth.userId,
      }
    })

    return {
      success: true,
      rawSecretKey: secretKey,
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        scopes: apiKey.scopes.split(","),
        createdAt: apiKey.createdAt,
      }
    }
  } catch (error: any) {
    console.error("Create API Key error:", error)
    return { success: false, error: "Failed to create API key" }
  }
}

export async function getApiKeys() {
  const auth = await requireTenantAuth("tenant_user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const keys = await db.apiKey.findMany({
      where: { agencyId: auth.agencyId },
      orderBy: { createdAt: "desc" }
    })

    return {
      success: true,
      apiKeys: keys.map(k => ({
        ...k,
        scopes: k.scopes.split(",")
      }))
    }
  } catch (error: any) {
    console.error("Get API Keys error:", error)
    return { success: false, error: "Failed to fetch API keys" }
  }
}

export async function revokeApiKey(id: string) {
  const auth = await requireTenantAuth("tenant_admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    await db.apiKey.updateMany({
      where: { id, agencyId: auth.agencyId },
      data: { status: "revoked" }
    })

    return { success: true }
  } catch (error: any) {
    console.error("Revoke API Key error:", error)
    return { success: false, error: "Failed to revoke API key" }
  }
}
