import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { inngest } from "@/lib/inngest/client"
import { logWebhookDelivery } from "@/lib/webhooks"
import { checkRateLimit } from "@/lib/rate-limit"

/**
 * Universal Inbound Webhook Trigger Gateway
 * Ingests external lead payloads from Facebook Ads, Zapier, Make, Typeform, Webflow, etc.
 * URL: POST /api/v1/webhooks/inbound/[workflowId]
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await params

  // Rate Limiting (120 requests/minute per IP)
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown-ip"
  const rateLimit = checkRateLimit(`inbound-wh:${workflowId}:${clientIp}`, { maxRequests: 120, windowSeconds: 60 })

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests to this webhook endpoint" },
      { status: 429, headers: { "Retry-After": String(rateLimit.resetInSeconds) } }
    )
  }

  try {
    const workflow = await db.workflow.findUnique({
      where: { id: workflowId },
      include: { agency: true }
    })

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
    }

    const bodyText = await req.text()
    let payload: any = {}
    try {
      payload = JSON.parse(bodyText)
    } catch {
      payload = { raw: bodyText }
    }

    // Extract lead attributes with flexible key mapping
    const email = payload.email || payload.Email || payload.email_address || payload.user_email
    const phone = payload.phone || payload.Phone || payload.phone_number || payload.mobile
    const firstName = payload.firstName || payload.first_name || payload.name?.split(" ")?.[0] || "Inbound Lead"
    const lastName = payload.lastName || payload.last_name || payload.name?.split(" ")?.slice(1)?.join(" ") || ""

    const agencyId = workflow.agencyId

    // Upsert Contact
    let contact: any = null
    if (email || phone) {
      const cleanEmail = email ? email.trim().toLowerCase() : undefined
      const whereCondition = cleanEmail ? { agencyId, email: cleanEmail } : { agencyId, phone: phone?.trim() }

      contact = await db.contact.findFirst({ where: whereCondition })

      if (!contact) {
        contact = await db.contact.create({
          data: {
            agencyId,
            firstName,
            lastName,
            email: cleanEmail,
            phone: phone ? String(phone).trim() : undefined,
            tags: payload.tags ? (Array.isArray(payload.tags) ? payload.tags.join(",") : String(payload.tags)) : "inbound_webhook",
            leadScore: 50
          }
        })
      } else {
        contact = await db.contact.update({
          where: { id: contact.id },
          data: {
            firstName: firstName !== "Inbound Lead" ? firstName : contact.firstName,
            lastName: lastName || contact.lastName,
            phone: phone ? String(phone).trim() : contact.phone
          }
        })
      }
    }

    // Trigger Inngest Workflow Execution
    await inngest.send({
      name: "workflow.execute",
      data: {
        workflowId: workflow.id,
        contactId: contact?.id || null,
        triggerData: payload
      }
    }).catch(() => {})

    await logWebhookDelivery({
      event: `workflow.inbound.${workflow.id}`,
      payload,
      statusCode: 200,
      agencyId
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      workflowId: workflow.id,
      workflowName: workflow.name,
      contactId: contact?.id || null,
      receivedAt: new Date().toISOString()
    })
  } catch (err: any) {
    console.error("[Inbound Webhook Error]:", err)
    return NextResponse.json({ error: err.message || "Failed to process inbound webhook" }, { status: 500 })
  }
}
