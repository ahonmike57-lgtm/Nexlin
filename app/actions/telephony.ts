"use server"

import twilio from "twilio"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { pusherServer } from "@/lib/pusher"

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "AC_mock_sid"
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "mock_token"
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || "+1234567890"

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

export async function sendSMS(contactId: string, content: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const contact = await db.contact.findUnique({ where: { id: contactId } })
    if (!contact?.phone) {
      return { success: false, error: "Contact does not have a phone number" }
    }

    // Attempt to send real SMS if credentials exist, otherwise mock
    let messageSid = "mock_sid"
    if (TWILIO_ACCOUNT_SID !== "AC_mock_sid") {
      const result = await client.messages.create({
        body: content,
        from: TWILIO_PHONE_NUMBER,
        to: contact.phone,
      })
      messageSid = result.sid
    }

    // Find or create SMS conversation
    let conversation = await db.conversation.findFirst({
      where: {
        contactId,
        agencyId: contact.agencyId,
        channel: "sms",
      }
    })

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          contactId,
          agencyId: contact.agencyId,
          channel: "sms"
        }
      })
    }

    // Create message record
    const newMessage = await db.message.create({
      data: {
        conversationId: conversation.id,
        content,
        isOutbound: true,
        status: "delivered",
      }
    })

    await db.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() }
    })

    // Trigger pusher event for SMS channel as well
    try {
      await pusherServer.trigger(`conversation-${conversation.id}`, "new-message", newMessage)
    } catch (e) {
      console.error(e)
    }

    return { success: true, data: newMessage, messageSid }
  } catch (error) {
    console.error("Failed to send SMS:", error)
    return { success: false, error: "Failed to send SMS" }
  }
}
