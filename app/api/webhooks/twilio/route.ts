import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import Pusher from "pusher"
import twilio from "twilio"

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || "",
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || "",
  secret: process.env.PUSHER_SECRET || "",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1",
  useTLS: true,
})

export async function POST(req: NextRequest) {
  // Twilio sends as form-encoded
  const formData = await req.formData()
  const from = formData.get("From") as string
  const body = formData.get("Body") as string
  const to = formData.get("To") as string // Our Twilio number

  if (!from || !body) {
    return new NextResponse("Missing required fields", { status: 400 })
  }

  try {
    // Find the PhoneNumber record to get agencyId
    const phoneNumber = await db.phoneNumber.findFirst({ where: { number: to } })
    if (!phoneNumber) {
      console.warn(`[Twilio] Inbound SMS to unknown number: ${to}`)
      return new NextResponse("", { status: 200 })
    }

    const agencyId = phoneNumber.agencyId

    // Find or create contact by phone number
    let contact = await db.contact.findFirst({ where: { phone: from, agencyId } })
    if (!contact) {
      contact = await db.contact.create({
        data: {
          agencyId,
          firstName: from,
          phone: from,
        }
      })
      console.log(`[Twilio] Created new contact for inbound SMS from: ${from}`)
    }

    // Find or create open conversation
    let conversation = await db.conversation.findFirst({
      where: { agencyId, contactId: contact.id, channel: "sms", status: "open" }
    })
    if (!conversation) {
      conversation = await db.conversation.create({
        data: { agencyId, contactId: contact.id, channel: "sms" }
      })
    }

    // Save inbound message
    const message = await db.message.create({
      data: {
        conversationId: conversation.id,
        content: body,
        isOutbound: false,
        status: "delivered",
      }
    })

    // Update conversation timestamp
    await db.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() }
    })

    // Broadcast to Pusher for real-time update in chat UI
    if (process.env.PUSHER_APP_ID) {
      await pusher.trigger(`conversation-${conversation.id}`, "new-message", {
        id: message.id,
        conversationId: message.conversationId,
        content: message.content,
        isOutbound: false,
        status: message.status,
        createdAt: message.createdAt,
      })
    }

    console.log(`[Twilio] Inbound SMS from ${from}: "${body}"`)

    // Return empty TwiML response (don't auto-reply)
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
      headers: { "Content-Type": "text/xml" }
    })
  } catch (error) {
    console.error("[Twilio] Inbound webhook error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
