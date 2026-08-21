import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logWebhookDelivery } from "@/lib/webhooks"

/**
 * Webhook Ingestion Endpoint for Email Event Delivery (Bounces, Spam Complaints, Unsubscribes).
 * Compatible with Resend, SendGrid, Postmark, and Mailgun payloads.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
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
      statusCode: 200
    }).catch(() => {})

    console.log(`[Email Deliverability] Suppressed email ${cleanEmail} due to ${reason}`)
    return NextResponse.json({ success: true, suppressedEmail: cleanEmail, reason })
  } catch (error: any) {
    console.error("[Email Webhook Error]:", error)
    return NextResponse.json({ error: error.message || "Failed to process email event" }, { status: 500 })
  }
}
