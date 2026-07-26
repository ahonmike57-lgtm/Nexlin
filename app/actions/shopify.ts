"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function connectShopifyStore(shopDomain: string, accessToken: string) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const integration = await db.snapshot.create({
      data: {
        agencyId: auth.agencyId,
        name: `Shopify - ${shopDomain}`,
        version: "shopify_integration",
        description: JSON.stringify({
          shopDomain: shopDomain.trim(),
          accessToken: accessToken.trim(),
          connectedAt: new Date().toISOString()
        })
      }
    })

    revalidatePath("/settings/integrations")
    return { success: true, integration }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
