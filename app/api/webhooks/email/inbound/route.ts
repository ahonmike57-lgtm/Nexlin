import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { pusherServer } from "@/lib/pusher"
import { logWebhookDelivery, verifyApiKeyForAgency, verifySharedSecret } from "@/lib/webhooks"

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const bearerToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || null
    const verifiedKey = await verifyApiKeyForAgency(authHeader)
    const emailWebhookSecret = process.env.EMAIL_WEBHOOK_SECRET?.trim()
    const sharedSecretOk = !verifiedKey
      ? verifySharedSecret(req.headers.get("x-webhook-secret") || bearerToken, emailWebhookSecret)
      : false

    if (!verifiedKey && !sharedSecretOk) {
      if (!emailWebhookSecret && !authHeader && process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Inbound email webhook verification not configured" },
          { status: 503 }
        )
      }
      return NextResponse.json({ error: "Unauthorized webhook request" }, { status: 401 })
    }

    let from = ""
    let to = ""
    let subject = ""
    let text = ""
    let html = ""

    const contentType = req.headers.get("content-type") || ""

    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({}))
      from = body.from || body.From || body.sender || ""
      to = body.to || body.To || body.recipient || ""
      subject = body.subject || body.Subject || "Inbound Email"
      text = body.text || body.body || body["stripped-text"] || ""
      html = body.html || body["stripped-html"] || ""
    } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData()
      from = (formData.get("from") || formData.get("From") || formData.get("sender") || "") as string
      to = (formData.get("to") || formData.get("To") || formData.get("recipient") || "") as string
      subject = (formData.get("subject") || formData.get("Subject") || "Inbound Email") as string
      text = (formData.get("text") || formData.get("body") || formData.get("stripped-text") || "") as string
      html = (formData.get("html") || formData.get("stripped-html") || "") as string
    }

    if (!from) {
      return NextResponse.json({ error: "Missing sender address (from)" }, { status: 400 })
    }

    // Clean sender email (extract from "John Doe <john@example.com>")
    const emailMatch = from.match(/<([^>]+)>/) || [null, from]
    const cleanEmail = (emailMatch[1] || from).trim().toLowerCase()
    const senderName = from.replace(/<[^>]+>/, "").trim() || cleanEmail.split("@")[0]

    // 1. Resolve Target Agency strictly (locked to API key or exact recipient domain/subdomain)
    let agencyId = ""
    if (verifiedKey) {
      agencyId = verifiedKey.agencyId
    } else {
      const rawTo = Array.isArray(to) ? String(to[0] || "") : String(to || "")
      const cleanTo = (rawTo.match(/<([^>]+)>/)?.[1] || rawTo).trim().toLowerCase()
      if (!cleanTo.includes("@")) {
        return NextResponse.json({ error: "Target agency could not be resolved" }, { status: 404 })
      }
      const [toLocal, toDomain] = cleanTo.split("@")
      if (!toLocal || !toDomain) {
        return NextResponse.json({ error: "Target agency could not be resolved" }, { status: 404 })
      }

      const targetAgency = await db.agency.findFirst({
        where: {
          OR: [
            { customDomain: { equals: toDomain, mode: "insensitive" } },
            { subdomain: { equals: toLocal, mode: "insensitive" } }
          ]
        },
        select: { id: true }
      })

      if (!targetAgency) {
        return NextResponse.json({ error: "No matching agency for recipient address" }, { status: 404 })
      }
      agencyId = targetAgency.id
    }

    // 2. Find or Create Contact (excluding soft-deleted contacts)
    let contact = await db.contact.findFirst({
      where: { email: cleanEmail, agencyId, deletedAt: null }
    })

    if (!contact) {
      const nameParts = senderName.split(" ")
      const firstName = nameParts[0] || "Email"
      const lastName = nameParts.slice(1).join(" ") || "Contact"

      contact = await db.contact.create({
        data: {
          agencyId,
          firstName,
          lastName,
          email: cleanEmail,
          leadScore: 10
        }
      })
    }

    // 3. Find or Create Conversation Thread
    let conversation = await db.conversation.findFirst({
      where: {
        agencyId,
        contactId: contact.id,
        channel: "email"
      }
    })

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          agencyId,
          contactId: contact.id,
          channel: "email",
          status: "open"
        }
      })
    }

    // 4. Save Inbound Message
    const content = text || html || subject || "[Empty Email Body]"
    const message = await db.message.create({
      data: {
        conversationId: conversation.id,
        isOutbound: false,
        content: `Subject: ${subject}\n\n${content}`,
        status: "delivered"
      }
    })

    // Update conversation timestamp
    await db.conversation.updateMany({
      where: { id: conversation.id },
      data: { updatedAt: new Date(), status: "open" }
    })

    // 5. Broadcast Live Pusher Notification
    try {
      await pusherServer.trigger(`conversation-${conversation.id}`, "new-message", message)
      await pusherServer.trigger(`agency-${agencyId}`, "inbound-email", {
        contactId: contact.id,
        contactName: `${contact.firstName} ${contact.lastName || ""}`.trim(),
        subject,
        preview: content.slice(0, 120)
      })
    } catch (pushErr) {
      console.warn("Inbound email Pusher broadcast failed:", pushErr)
    }

    await logWebhookDelivery({
      event: "email.inbound.processed",
      payload: { from: cleanEmail, to, subject },
      statusCode: 200,
      agencyId
    })

    return NextResponse.json({ success: true, messageId: message.id, contactId: contact.id })
  } catch (error: any) {
    console.error("Inbound email webhook error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
