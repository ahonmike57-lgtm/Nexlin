"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"

export async function getWebhookDeliveries() {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const deliveries = await db.webhookDelivery.findMany({
      where: { agencyId: auth.agencyId },
      take: 50,
      orderBy: { deliveredAt: "desc" }
    })

    return { success: true, deliveries }
  } catch (error: any) {
    console.error("Get Webhook Deliveries error:", error)
    return { success: false, error: "Failed to fetch webhook deliveries" }
  }
}

export async function retryWebhookDelivery(deliveryId: string) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const delivery = await db.webhookDelivery.findFirst({
      where: { id: deliveryId, agencyId: auth.agencyId }
    })

    if (!delivery) {
      return { success: false, error: "Webhook delivery log not found" }
    }

    // Trigger Outbound Retry
    let responseStatus = 200
    let responseBody = '{"status":"success","retried":true}'
    let success = true

    try {
      const res = await fetch(delivery.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: delivery.payload,
      })
      responseStatus = res.status
      responseBody = await res.text()
      success = res.ok
    } catch (e: any) {
      responseStatus = 500
      responseBody = e.message || "Failed to reach target URL"
      success = false
    }

    const newDelivery = await db.webhookDelivery.create({
      data: {
        webhookId: delivery.webhookId,
        agencyId: auth.agencyId,
        url: delivery.url,
        event: delivery.event,
        payload: delivery.payload,
        responseStatus,
        responseBody,
        success,
        retryCount: delivery.retryCount + 1
      }
    })

    return { success: true, delivery: newDelivery }
  } catch (error: any) {
    console.error("Retry Webhook error:", error)
    return { success: false, error: "Failed to retry webhook delivery" }
  }
}
