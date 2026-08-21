import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { pusherServer } from "@/lib/pusher"
import { triggerWorkflows } from "@/app/actions/workflow-engine"
import { checkRateLimit } from "@/lib/rate-limit"
import { logWebhookDelivery } from "@/lib/webhooks"

/**
 * Unified Omni-Channel Inbound Message Gateway
 * Standardizes messages from SMS, Email, WhatsApp, and Web Chat into unified conversations.
 * URL: POST /api/webhooks/omnichannel
 */
export async function POST(req: NextRequest) {
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  const rateLimit = checkRateLimit(`omnichannel-inbound:${clientIp}`, { maxRequests: 120, windowSeconds: 60 })

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many inbound webhook requests" },
      { status: 429, headers: { "Retry-After": String(rateLimit.resetInSeconds) } }
    )
  }

  try {
    const payload = await req.json()
    const agencyId = payload.agencyId
    const channel = (payload.channel || "sms").toLowerCase() // "sms", "email", "whatsapp", "live_chat"
    const fromIdentifier = payload.from || payload.sender || payload.email || payload.phone
    const content = payload.content || payload.message || payload.text || ""
    const senderName = payload.senderName || payload.name || "Inbound Lead"

    if (!agencyId || !fromIdentifier || !content) {
      return NextResponse.json({ error: "Missing required fields: agencyId, from, and content" }, { status: 400 })
    }

    const cleanIdentifier = String(fromIdentifier).trim()
    const isEmail = cleanIdentifier.includes("@")

    // 1. Locate or Create Contact
    let contact = await db.contact.findFirst({
      where: {
        agencyId,
        OR: [
          ...(isEmail ? [{ email: cleanIdentifier.toLowerCase() }] : []),
          ...(!isEmail ? [{ phone: cleanIdentifier }] : [])
        ]
      }
    })

    if (!contact) {
      contact = await db.contact.create({
        data: {
          agencyId,
          firstName: senderName.split(" ")[0] || "Inbound",
          lastName: senderName.split(" ").slice(1).join(" ") || "",
          email: isEmail ? cleanIdentifier.toLowerCase() : undefined,
          phone: !isEmail ? cleanIdentifier : undefined,
          tags: `omnichannel_${channel}`,
          leadScore: 25
        }
      })
    }

    // 2. Locate or Create Conversation Thread
    let conversation = await db.conversation.findFirst({
      where: {
        agencyId,
        contactId: contact.id,
        channel
      }
    })

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          agencyId,
          contactId: contact.id,
          channel,
          status: "open"
        }
      })
    } else {
      await db.conversation.update({
        where: { id: conversation.id },
        data: {
          status: "open",
          updatedAt: new Date()
        }
      })
    }

    // 3. Create Inbound Message
    const message = await db.message.create({
      data: {
        conversationId: conversation.id,
        isOutbound: false,
        content: content.trim(),
        status: "delivered",
      }
    })

    // 4. Create In-App Notification
    await db.notification.create({
      data: {
        agencyId,
        type: "message",
        title: `💬 New ${channel.toUpperCase()} from ${contact.firstName}`,
        body: content.slice(0, 80),
        link: "/chat"
      }
    }).catch(() => {})

    // 5. Broadcast live to Omni-Inbox via Pusher
    try {
      await pusherServer.trigger(`agency-${agencyId}`, "new-message", {
        conversationId: conversation.id,
        contactId: contact.id,
        channel,
        content: message.content,
        createdAt: message.createdAt,
        contact: {
          id: contact.id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone
        }
      })
    } catch {}

    // 6. Trigger Workflows
    await triggerWorkflows(agencyId, "inbound_message_received", {
      contactId: contact.id,
      conversationId: conversation.id,
      channel,
      messageContent: content
    }).catch(() => {})

    await logWebhookDelivery({
      event: `omnichannel.${channel}.inbound`,
      payload,
      statusCode: 200,
      agencyId
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
      messageId: message.id,
      contactId: contact.id
    })
  } catch (err: any) {
    console.error("[Omni-Channel Webhook Error]:", err)
    return NextResponse.json({ error: err.message || "Failed to process inbound message" }, { status: 500 })
  }
}
