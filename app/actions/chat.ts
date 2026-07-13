"use server"

import { db } from "@/lib/db"
import { pusherServer } from "@/lib/pusher"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"
import twilio from "twilio"

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "AC_mock_sid"
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "mock_token"
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || "+1234567890"

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

export async function getConversations(agencyId: string) {
  try {
    const conversations = await db.conversation.findMany({
      where: { agencyId },
      include: {
        contact: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: { updatedAt: "desc" }
    })
    
    return { success: true, data: conversations }
  } catch (error) {
    console.error("Failed to fetch conversations:", error)
    return { success: false, error: "Failed to fetch conversations" }
  }
}

export async function getMessages(conversationId: string) {
  try {
    const messages = await db.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" }
    })
    return { success: true, data: messages }
  } catch (error) {
    console.error("Failed to fetch messages:", error)
    return { success: false, error: "Failed to fetch messages" }
  }
}

export async function sendMessage(conversationId: string, content: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true }
    })
    
    if (!conversation) throw new Error("Conversation not found")

    // If channel is SMS, send via Twilio
    if (conversation.channel === "sms" && conversation.contact.phone) {
      if (TWILIO_ACCOUNT_SID !== "AC_mock_sid") {
        await twilioClient.messages.create({
          body: content,
          from: TWILIO_PHONE_NUMBER,
          to: conversation.contact.phone,
        })
      }
    }

    const newMessage = await db.message.create({
      data: {
        conversationId,
        content,
        isOutbound: true,
        status: "delivered", // default to delivered for UI
      },
    })

    try {
      await pusherServer.trigger(`conversation-${conversationId}`, "new-message", newMessage)
    } catch (error) {
      console.error("Pusher trigger error:", error)
    }

    // Update conversation updatedAt
    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    })

    revalidatePath("/chat")
    return { success: true, data: newMessage }
  } catch (error) {
    console.error("Failed to send message:", error)
    return { success: false, error: "Failed to send message" }
  }
}
