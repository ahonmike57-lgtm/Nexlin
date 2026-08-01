import crypto from "crypto"
import { db } from "@/lib/db"

/**
 * Verify Meta WhatsApp Cloud API Webhook HMAC Signature (sha256).
 */
export function verifyMetaSignature(payloadBuffer: Buffer | string, signatureHeader: string | null, appSecret: string): boolean {
  if (!signatureHeader || !appSecret) return false

  const signature = signatureHeader.replace("sha256=", "").trim()
  const expectedHash = crypto
    .createHmac("sha256", appSecret)
    .update(payloadBuffer)
    .digest("hex")

  try {
    return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expectedHash, "hex"))
  } catch {
    return false
  }
}

/**
 * Log Webhook Event to Audit Trail
 */
export async function logWebhookDelivery(data: {
  webhookId?: string
  url?: string
  event: string
  payload: any
  statusCode: number
  error?: string
  agencyId?: string
}) {
  try {
    const defaultAgency = await db.agency.findFirst({ select: { id: true } })
    const targetAgencyId = data.agencyId || defaultAgency?.id
    if (!targetAgencyId) return null

    const delivery = await db.webhookDelivery.create({
      data: {
        webhookId: data.webhookId || "system-meta-webhook",
        agencyId: targetAgencyId,
        url: data.url || "https://api.nexlin.com/webhooks/whatsapp",
        event: data.event,
        payload: typeof data.payload === "string" ? data.payload : JSON.stringify(data.payload),
        responseStatus: data.statusCode,
        responseBody: data.error || "OK",
        success: data.statusCode >= 200 && data.statusCode < 300
      }
    })
    return delivery
  } catch (err) {
    console.error("Failed to log webhook delivery:", err)
    return null
  }
}
