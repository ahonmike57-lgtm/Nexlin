"use server"

import { db } from "@/lib/db"
import { getOrCreateAgency } from "./agency"
import { revalidatePath } from "next/cache"

export async function getConversations() {
  try {
    const agencyId = await getOrCreateAgency()
    const conversations = await db.conversation.findMany({
      where: { agencyId },
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
    // Basic auth check
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
    // Basic auth check
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
    
    // Check if open conversation already exists
    const existing = await db.conversation.findFirst({
      where: { agencyId, contactId, status: "open", channel }
    })
    
    if (existing) {
      return { success: true, data: existing }
    }
    
    const conversation = await db.conversation.create({
      data: {
        agencyId,
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
