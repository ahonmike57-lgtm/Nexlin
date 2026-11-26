import crypto from "crypto"
import twilio from "twilio"
import { db } from "@/lib/db"

/**
 * Constant-time comparison of two shared secrets.
 */
export function verifySharedSecret(
  provided: string | null | undefined,
  expected: string | undefined
): boolean {
  const cleanProvided = provided?.trim()
  const cleanExpected = expected?.trim()
  if (!cleanProvided || !cleanExpected) return false

  const a = crypto.createHash("sha256").update(cleanProvided).digest()
  const b = crypto.createHash("sha256").update(cleanExpected).digest()
  return crypto.timingSafeEqual(a, b)
}

/**
 * Verify Bearer API Key and resolve its owning agency.
 */
export async function verifyApiKeyForAgency(
  authHeader: string | null
): Promise<{ agencyId: string; apiKeyId: string } | null> {
  const match = authHeader?.match(/^Bearer\s+(.+)$/i)
  const token = match?.[1]?.trim()
  if (!token) return null

  const keyHash = crypto.createHash("sha256").update(token).digest("hex")
  const apiKey = await db.apiKey.findFirst({
    where: { keyHash, status: "active" },
    select: { id: true, agencyId: true, expiresAt: true },
  })

  if (!apiKey) return null
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null

  db.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {})

  return { agencyId: apiKey.agencyId, apiKeyId: apiKey.id }
}

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
 * Verify Shopify Webhook HMAC Signature (sha256).
 */
export function verifyShopifySignature(rawBody: string, hmacHeader: string | null, secret: string): boolean {
  if (!hmacHeader || !secret) return false
  try {
    const hash = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64")
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmacHeader))
  } catch {
    return false
  }
}

/**
 * Verify Twilio Webhook Signature.
 */
export function verifyTwilioSignature(authToken: string, twilioSignature: string | null, url: string, params: Record<string, any>): boolean {
  if (!authToken || !twilioSignature) return false
  try {
    return twilio.validateRequest(authToken, twilioSignature, url, params)
  } catch {
    return false
  }
}

/**
 * Verify inbound Twilio webhook request across direct and reverse-proxied URLs.
 * Fails closed when TWILIO_AUTH_TOKEN is missing in production, or when x-twilio-signature is missing/invalid.
 */
export function verifyTwilioWebhookRequest(
  req: Request,
  params: Record<string, string>
): { valid: boolean; status?: number; error?: string } {
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim()
  if (!authToken) {
    if (process.env.NODE_ENV === "production") {
      return { valid: false, status: 503, error: "Twilio webhook verification not configured" }
    }
    return { valid: true }
  }

  const signature = req.headers.get("x-twilio-signature")
  if (!signature) {
    return { valid: false, status: 401, error: "Missing Twilio signature" }
  }

  const candidateUrls = new Set<string>([req.url])
  try {
    const parsed = new URL(req.url)
    const pathWithQuery = `${parsed.pathname}${parsed.search}`
    const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim()
    const host = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || req.headers.get("host")?.trim()
    if (host) {
      candidateUrls.add(`${forwardedProto || "https"}://${host}${pathWithQuery}`)
      candidateUrls.add(`http://${host}${pathWithQuery}`)
    }
    const appBase = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL)?.trim()
    if (appBase) {
      candidateUrls.add(`${appBase.replace(/\/$/, "")}${pathWithQuery}`)
    }
  } catch {}

  for (const url of candidateUrls) {
    if (verifyTwilioSignature(authToken, signature, url, params)) {
      return { valid: true }
    }
  }

  return { valid: false, status: 401, error: "Invalid Twilio signature" }
}

/**
 * Log Webhook Event to Audit Trail (requires verified agencyId)
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
    if (!data.agencyId) return null

    const delivery = await db.webhookDelivery.create({
      data: {
        webhookId: data.webhookId || "system-meta-webhook",
        agencyId: data.agencyId,
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
