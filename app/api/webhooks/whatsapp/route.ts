import { NextRequest, NextResponse } from "next/server"
import { verifyMetaSignature, verifySharedSecret, logWebhookDelivery } from "@/lib/webhooks"
import { db } from "@/lib/db"
import { findAgencyByWhatsappPhoneNumberId, broadcastNewMessage } from "@/lib/messaging"

export async function GET(req: NextRequest) {
  const verifyToken = process.env.META_WHATSAPP_VERIFY_TOKEN?.trim()
  if (!verifyToken) {
    return NextResponse.json(
      { error: "WhatsApp webhook verification not configured" },
      { status: 503 }
    )
  }

  const { searchParams } = new URL(req.url)
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  if (mode === "subscribe" && verifySharedSecret(token, verifyToken)) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: "Verification token mismatch" }, { status: 403 })
}

export async function POST(req: NextRequest) {
  let bodyText = ""
  let resolvedAgencyId: string | undefined

  try {
    bodyText = await req.text()
    const signature = req.headers.get("x-hub-signature-256")
    const appSecret = process.env.META_APP_SECRET?.trim()

    if (!appSecret && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "META_APP_SECRET not configured" }, { status: 503 })
    }

    if (appSecret && !verifyMetaSignature(bodyText, signature, appSecret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const payload = JSON.parse(bodyText)

    // Process WhatsApp Entry Payload
    if (payload.entry) {
      for (const entry of payload.entry) {
        for (const change of entry.changes || []) {
          const value = change.value
          const recipientPhoneNumberId = value?.metadata?.phone_number_id

          if (value?.messages) {
            for (const msg of value.messages) {
              try {
                const fromNumber = msg.from // e.g. "14155550192"
                const normalizedFrom = fromNumber.startsWith("+") ? fromNumber : `+${fromNumber}`
                const textContent = msg.text?.body || msg.caption || "[Media Message]"

                // Route strictly to the agency owning recipientPhoneNumberId
                const targetAgencyId = recipientPhoneNumberId
                  ? await findAgencyByWhatsappPhoneNumberId(recipientPhoneNumberId)
                  : null

                if (!targetAgencyId) {
                  console.warn(
                    `[WhatsApp Webhook] Unmapped recipient phone_number_id (${recipientPhoneNumberId}); skipping message from ${fromNumber} to prevent tenant leakage.`
                  )
                  continue
                }

                resolvedAgencyId = targetAgencyId

                // Find or create contact strictly scoped to target agency (ignoring trashed contacts)
                let contact = await db.contact.findFirst({
                  where: {
                    agencyId: targetAgencyId,
                    deletedAt: null,
                    OR: [{ phone: fromNumber }, { phone: normalizedFrom }]
                  }
                })

                if (!contact) {
                  contact = await db.contact.create({
                    data: {
                      agencyId: targetAgencyId,
                      firstName: value.contacts?.[0]?.profile?.name || "WhatsApp",
                      lastName: "User",
                      phone: normalizedFrom
                    }
                  })
                }

                if (contact) {
                  // Find or create conversation
                  let conv = await db.conversation.findFirst({
                    where: { agencyId: targetAgencyId, contactId: contact.id, channel: "whatsapp" }
                  })

                  if (!conv) {
                    conv = await db.conversation.create({
                      data: {
                        agencyId: targetAgencyId,
                        contactId: contact.id,
                        channel: "whatsapp"
                      }
                    })
                  }

                  // Ingest message into thread
                  const createdMsg = await db.message.create({
                    data: {
                      conversationId: conv.id,
                      content: textContent,
                      isOutbound: false,
                      status: "delivered"
                    }
                  })

                  await db.conversation.update({
                    where: { id: conv.id },
                    data: { updatedAt: new Date() }
                  })

                  // Broadcast live message to active conversation via Pusher
                  broadcastNewMessage({
                    id: createdMsg.id,
                    conversationId: conv.id,
                    content: createdMsg.content,
                    isOutbound: false,
                    status: createdMsg.status,
                    createdAt: createdMsg.createdAt
                  })
                }
              } catch (msgError) {
                console.warn("WhatsApp message processing error (skipped):", msgError)
              }
            }
          }
        }
      }
    }

    if (resolvedAgencyId) {
      await logWebhookDelivery({
        event: "whatsapp.inbound.processed",
        payload,
        statusCode: 200,
        agencyId: resolvedAgencyId,
      })
    }

    return NextResponse.json({ status: "success" }, { status: 200 })
  } catch (error: any) {
    console.error("WhatsApp Webhook Ingestion Error:", error)
    if (resolvedAgencyId) {
      await logWebhookDelivery({
        event: "whatsapp.inbound.error",
        payload: bodyText,
        statusCode: 500,
        error: error.message,
        agencyId: resolvedAgencyId,
      })
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
