import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { pusherServer } from "@/lib/pusher"

// Meta WhatsApp Webhook Verification
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "nexlin_whatsapp_token_2026"

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }

  return new Response("Forbidden", { status: 403 })
}

// Inbound WhatsApp Cloud API Webhook
export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value
          if (value && value.messages) {
            for (const msg of value.messages) {
              const fromPhone = msg.from // Sender phone
              const textBody = msg.text?.body || "Media message"

              // Find contact or fallback
              const contact = await db.contact.findFirst({
                where: { phone: { contains: fromPhone.slice(-10) } }
              })

              if (contact) {
                let conversation = await db.conversation.findFirst({
                  where: { contactId: contact.id, channel: "whatsapp" }
                })

                if (!conversation) {
                  conversation = await db.conversation.create({
                    data: {
                      agencyId: contact.agencyId,
                      contactId: contact.id,
                      channel: "whatsapp"
                    }
                  })
                }

                const newMsg = await db.message.create({
                  data: {
                    conversationId: conversation.id,
                    content: textBody,
                    isOutbound: false,
                    status: "delivered"
                  }
                })

                try {
                  await pusherServer.trigger(`conversation-${conversation.id}`, "new-message", newMsg)
                } catch (e) {
                  console.error("Pusher trigger failed:", e)
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ status: "success" })
  } catch (error) {
    console.error("WhatsApp Webhook Error:", error)
    return NextResponse.json({ error: "Webhook Error" }, { status: 500 })
  }
}
