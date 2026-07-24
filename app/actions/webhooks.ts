"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { checkPermission } from "@/lib/permissions"

export async function createWebhook(agencyId: string, data: { name: string; url: string; event: string }) {
  try {
    const isAllowed = await checkPermission(agencyId, "Agency Admin")
    if (!isAllowed) return { success: false, error: "Insufficient permissions" }

    const webhook = await db.webhook.create({
      data: {
        agencyId,
        name: data.name,
        url: data.url,
        event: data.event,
      }
    })
    
    revalidatePath("/settings/integrations/webhooks")
    return { success: true, webhook }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteWebhook(id: string, agencyId: string) {
  try {
    const isAllowed = await checkPermission(agencyId, "Agency Admin")
    if (!isAllowed) return { success: false, error: "Insufficient permissions" }

    await db.webhook.delete({
      where: { id, agencyId }
    })
    
    revalidatePath("/settings/integrations/webhooks")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function dispatchWebhooks(agencyId: string, event: string, payload: any) {
  try {
    const webhooks = await db.webhook.findMany({
      where: { agencyId, event, isActive: true }
    })

    if (webhooks.length === 0) return { success: true, dispatched: 0 }

    for (const webhook of webhooks) {
      // Dispatch in background
      fetch(webhook.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          data: payload
        })
      }).catch(err => console.error(`Failed to dispatch webhook ${webhook.id}:`, err))
    }

    return { success: true, dispatched: webhooks.length }
  } catch (error) {
    console.error("Webhook dispatch error:", error)
    return { success: false }
  }
}
