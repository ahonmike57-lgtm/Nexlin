import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logWebhookDelivery, verifySharedSecret } from "@/lib/webhooks"

function verifySvixSignature(
  rawBody: string,
  svixId: string | null,
  svixTimestamp: string | null,
  svixSignature: string | null,
  secret: string | undefined
): boolean {
  const cleanSecret = secret?.trim()
  if (!cleanSecret || !svixId || !svixTimestamp || !svixSignature) return false

  const tsSeconds = Number(svixTimestamp)
  if (!Number.isFinite(tsSeconds)) return false
  if (Math.abs(Math.floor(Date.now() / 1000) - tsSeconds) > 300) return false

  try {
    const keyBytes = cleanSecret.startsWith("whsec_")
      ? Buffer.from(cleanSecret.slice(6), "base64")
      : Buffer.from(cleanSecret, "utf8")

    const expectedSig = crypto
      .createHmac("sha256", keyBytes)
      .update(`${svixId}.${svixTimestamp}.${rawBody}`)
      .digest("base64")

    const expectedBuf = Buffer.from(expectedSig, "utf8")
    const entries = svixSignature.trim().split(/\s+/)
    for (const entry of entries) {
      if (!entry.startsWith("v1,")) continue
      const candidate = Buffer.from(entry.slice(3), "utf8")
      if (candidate.length === expectedBuf.length && crypto.timingSafeEqual(candidate, expectedBuf)) {
        return true
      }
    }
    return false
  } catch {
    return false
  }
}

/**
 * Webhook Ingestion Endpoint for Email Event Delivery (Bounces, Spam Complaints, Unsubscribes).
 * Compatible with Resend, SendGrid, Postmark, and Mailgun payloads.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const authHeader = req.headers.get("authorization")
    const bearerToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || null
    const emailSecret = process.env.EMAIL_WEBHOOK_SECRET?.trim()
    const resendSecret = process.env.RESEND_WEBHOOK_SECRET?.trim()

    const sharedOk =
      verifySharedSecret(req.headers.get("x-webhook-secret") || bearerToken, emailSecret) ||
      verifySharedSecret(req.headers.get("x-webhook-secret") || bearerToken, resendSecret)

    const svixOk = verifySvixSignature(
      rawBody,
      req.headers.get("svix-id"),
      req.headers.get("svix-timestamp"),
      req.headers.get("svix-signature"),
      resendSecret
    )

    if (!sharedOk && !svixOk) {
      if (!emailSecret && !resendSecret && process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Email event webhook verification not configured" },
          { status: 503 }
        )
      }
      return NextResponse.json({ error: "Unauthorized webhook request" }, { status: 401 })
    }

    let payload: any
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
    }

    const eventType = payload.type || payload.event || "email.bounced"
    const data = payload.data || payload

    const email = data.to?.[0] || data.email || data.recipient
    const reason = eventType.includes("complaint") ? "complaint" :
                   eventType.includes("unsubscribe") ? "unsubscribe" : "hard_bounce"

    if (!email) {
      return NextResponse.json({ error: "No target email in payload" }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()

    // 1. Locate contact by email
    const contacts = await db.contact.findMany({
      where: { email: cleanEmail }
    })

    for (const contact of contacts) {
      // 2. Mark contact email as suppressed
      await db.contact.update({
        where: { id: contact.id },
        data: { emailSuppressed: true }
      })

      // 3. Add to agency suppression list
      await db.suppressionList.upsert({
        where: {
          agencyId_email: {
            agencyId: contact.agencyId,
            email: cleanEmail
          }
        },
        create: {
          agencyId: contact.agencyId,
          email: cleanEmail,
          reason
        },
        update: { reason }
      }).catch(() => {})
    }

    await logWebhookDelivery({
      event: eventType,
      payload,
      statusCode: 200,
      agencyId: contacts[0]?.agencyId
    }).catch(() => {})

    console.log(`[Email Deliverability] Suppressed email ${cleanEmail} due to ${reason}`)
    return NextResponse.json({ success: true, suppressedEmail: cleanEmail, reason })
  } catch (error: any) {
    console.error("[Email Webhook Error]:", error)
    return NextResponse.json({ error: error.message || "Failed to process email event" }, { status: 500 })
  }
}
