"use server"

import { db } from "@/lib/db"
import { getOrCreateAgency } from "./agency"
import { revalidatePath } from "next/cache"
import { getActiveSubAccountId } from "./subaccounts"
import Pusher from "pusher"

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || "",
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || "",
  secret: process.env.PUSHER_SECRET || "",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1",
  useTLS: true,
})

export async function getConversations() {
  try {
    const agencyId = await getOrCreateAgency()
    const subAgencyId = await getActiveSubAccountId()
    
    const whereClause: any = { agencyId }
    if (subAgencyId) {
      whereClause.subAgencyId = subAgencyId
    }

    const conversations = await db.conversation.findMany({
      where: whereClause,
      include: { 
        contact: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    })
    return { success: true, data: conversations }
  } catch (error) {
    console.error("Failed to fetch conversations:", error)
    return { success: false, error: "Failed to fetch conversations" }
  }
}

export async function getMessages(conversationId: string) {
  try {
    await getOrCreateAgency()
    
    const messages = await db.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' }
    })
    return { success: true, data: messages }
  } catch (error) {
    console.error("Failed to fetch messages:", error)
    return { success: false, error: "Failed to fetch messages" }
  }
}

export async function sendMessage(conversationId: string, content: string, isOutbound: boolean = true) {
  try {
    await getOrCreateAgency()
    
    const message = await db.message.create({
      data: {
        conversationId,
        content,
        isOutbound,
      }
    })
    
    // Update conversation updatedAt
    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    })

    // Broadcast real-time event via Pusher (fire-and-forget, don't block on failure)
    if (process.env.PUSHER_APP_ID) {
      pusher.trigger(`conversation-${conversationId}`, "new-message", {
        id: message.id,
        conversationId: message.conversationId,
        content: message.content,
        isOutbound: message.isOutbound,
        status: message.status,
        createdAt: message.createdAt,
      }).catch((err) => console.warn("Pusher trigger failed:", err))
    }
    
    revalidatePath("/chat")
    return { success: true, data: message }
  } catch (error: any) {
    console.error("Failed to send message:", error)
    return { success: false, error: error.message || "Failed to send message" }
  }
}

export async function createConversation(contactId: string, channel: string = "sms") {
  try {
    const agencyId = await getOrCreateAgency()
    const subAgencyId = await getActiveSubAccountId()
    
    const whereClause: any = { agencyId, contactId, status: "open", channel }
    if (subAgencyId) {
      whereClause.subAgencyId = subAgencyId
    }

    const existing = await db.conversation.findFirst({
      where: whereClause
    })
    
    if (existing) {
      return { success: true, data: existing }
    }
    
    const conversation = await db.conversation.create({
      data: {
        agencyId,
        subAgencyId,
        contactId,
        channel
      }
    })
    
    revalidatePath("/chat")
    return { success: true, data: conversation }
  } catch (error: any) {
    console.error("Failed to create conversation:", error)
    return { success: false, error: error.message || "Failed to create conversation" }
  }
}
