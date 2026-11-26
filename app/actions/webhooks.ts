"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { requireTenantAuth } from "@/lib/permissions"
import { assertSafeOutboundUrl } from "@/lib/ssrf"
import { dispatchWebhooksInternal } from "@/lib/webhooks"

export async function createWebhook(_agencyId: string, data: { name: string; url: string; event: string }) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Insufficient permissions" }
  }

  try {
    const safeUrl = assertSafeOutboundUrl(data.url)

    const webhook = await db.webhook.create({
      data: {
        agencyId: auth.agencyId,
        name: data.name.trim(),
        url: safeUrl.toString(),
        event: data.event.trim(),
      }
    })
    
    revalidatePath("/settings/integrations/webhooks")
    return { success: true, webhook }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create webhook" }
  }
}

export async function deleteWebhook(id: string, _agencyId?: string) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Insufficient permissions" }
  }

  try {
    const deleted = await db.webhook.deleteMany({
      where: { id, agencyId: auth.agencyId }
    })

    if (deleted.count === 0) {
      return { success: false, error: "Webhook not found" }
    }
    
    revalidatePath("/settings/integrations/webhooks")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete webhook" }
  }
}

export async function dispatchWebhooks(_agencyId: string, event: string, payload: any) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  return dispatchWebhooksInternal(auth.agencyId, event, payload)
}
