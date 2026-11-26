"use server"

import { db } from "@/lib/db"
import { encryptConfig } from "@/lib/encryption"
import { requireTenantAuth } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function connectShopifyStore(shopDomain: string, accessToken: string) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  const cleanDomain = shopDomain?.trim()
  const cleanToken = accessToken?.trim()
  if (!cleanDomain || !cleanToken) {
    return { success: false, error: "Shop domain and access token are required" }
  }

  try {
    const integration = await db.snapshot.create({
      data: {
        agencyId: auth.agencyId,
        name: `Shopify - ${cleanDomain}`,
        version: "shopify_integration",
        description: JSON.stringify({
          shopDomain: cleanDomain,
          accessToken: encryptConfig(cleanToken),
          encrypted: true,
          connectedAt: new Date().toISOString()
        })
      }
    })

    revalidatePath("/settings/integrations")
    return {
      success: true,
      integration: {
        id: integration.id,
        name: integration.name,
        shopDomain: cleanDomain,
        createdAt: integration.createdAt
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
