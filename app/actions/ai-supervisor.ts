"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { pusherServer } from "@/lib/pusher"
import { revalidatePath } from "next/cache"

export async function interruptAiChatAndTakeover(conversationId: string, supervisorNote?: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    // 1. Tag conversation to silence AI bot
    const conversation = await db.conversation.update({
      where: { id: conversationId },
      data: {
        updatedAt: new Date()
      }
    })

    // 2. Post system message indicating human takeover
    const systemMsg = await db.message.create({
      data: {
        conversationId,
        content: `[Supervisor Takeover] Human agent ${auth.userId} took over control from AI. ${supervisorNote || ''}`,
        isOutbound: true,
        status: "delivered"
      }
    })

    try {
      await pusherServer.trigger(`conversation-${conversationId}`, "ai-takeover", {
        takenOverBy: auth.userId,
        message: systemMsg
      })
    } catch (e) {
      console.error(e)
    }

    revalidatePath("/chat")
    return { success: true, conversation }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
