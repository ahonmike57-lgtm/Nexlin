import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { inngest } from "@/lib/inngest/client"
import { logWebhookDelivery, verifyApiKeyForAgency, verifySharedSecret } from "@/lib/webhooks"
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
      include: { agency: true, triggers: true }
    })

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
    }

    if (workflow.status !== "active") {
      return NextResponse.json({ error: "Workflow is not active" }, { status: 403 })
    }

    const authHeader = req.headers.get("authorization")
    if (authHeader) {
      const verified = await verifyApiKeyForAgency(authHeader)
      if (!verified) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
      }
      if (verified.agencyId !== workflow.agencyId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } else {
      let triggerSecret = ""
      for (const trigger of workflow.triggers) {
        if (trigger.type !== "inbound_webhook" && !trigger.config) continue
        if (!trigger.config) continue
        try {
          const cfg = JSON.parse(trigger.config)
          if (typeof cfg?.secret === "string" && cfg.secret.trim()) {
            triggerSecret = cfg.secret.trim()
            break
          }
        } catch {}
      }

      if (triggerSecret) {
        const providedSecret = req.headers.get("x-webhook-secret") || req.nextUrl.searchParams.get("secret")
        if (!verifySharedSecret(providedSecret, triggerSecret)) {
          return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 })
        }
      } else if (process.env.INBOUND_WEBHOOK_SECRET) {
        if (!verifySharedSecret(req.headers.get("x-webhook-secret"), process.env.INBOUND_WEBHOOK_SECRET)) {
          return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 })
        }
      }
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
