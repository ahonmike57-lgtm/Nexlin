"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"

function sanitizePayload(raw: string): string {
  try {
    const obj = JSON.parse(raw)
    const maskSensitive = (item: any): any => {
      if (typeof item !== "object" || item === null) return item
      const copy: any = Array.isArray(item) ? [] : {}
      for (const [key, val] of Object.entries(item)) {
        if (/password|secret|token|apiKey|authorization|credit_card|ssn/i.test(key) && typeof val === "string") {
          copy[key] = "••••••••"
        } else if (typeof val === "object" && val !== null) {
          copy[key] = maskSensitive(val)
        } else {
          copy[key] = val
        }
      }
      return copy
    }
    return JSON.stringify(maskSensitive(obj))
  } catch (e) {
    return raw
  }
}

export async function getWebhookDeliveries() {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const rawDeliveries = await db.webhookDelivery.findMany({
      where: { agencyId: auth.agencyId },
      take: 50,
      orderBy: { deliveredAt: "desc" }
    })

    const deliveries = rawDeliveries.map(d => ({
      ...d,
      payload: sanitizePayload(d.payload),
      responseBody: sanitizePayload(d.responseBody || "")
    }))

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
