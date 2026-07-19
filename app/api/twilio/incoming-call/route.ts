import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { pusherServer } from "@/lib/pusher"
import { generateAiReply } from "@/app/actions/ai"

export async function POST(req: Request) {
  try {
    const { agencyId, from } = await req.json()
    if (!agencyId || !from) {
      return NextResponse.json({ success: false, error: "Missing agencyId or from" }, { status: 400 })
    }

    // 1. Check if Missed Call Text-Back is enabled for this agency's voice agent
    const agent = await db.voiceAgent.findFirst({
      where: { agencyId, isActive: true }
    })

    if (!agent || !agent.missedCallEnabled) {
      return NextResponse.json({ success: false, error: "Missed call text-back is not enabled or agent offline." })
    }

    // 2. Find or create the contact based on the phone number
    let contact = await db.contact.findFirst({
      where: { agencyId, phone: from }
    })

    if (!contact) {
      contact = await db.contact.create({
        data: {
          agencyId,
          firstName: "Unknown Caller",
          phone: from
        }
      })
      // Trigger new contact notification
      await pusherServer.trigger(`agency-${agencyId}`, "notification", {
        id: Math.random().toString(),
        title: "New Lead (Missed Call)",
        body: `A new contact called from ${from}.`,
        type: "lead",
        createdAt: new Date(),
        read: false
      })
    }

    // 3. Find or create the SMS conversation
    let conversation = await db.conversation.findFirst({
      where: { agencyId, contactId: contact.id, channel: "sms" }
    })

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          agencyId,
          contactId: contact.id,
          channel: "sms",
          aiAutoReply: agent.missedCallAIFollowUp
        }
      })
    } else {
      // Ensure AI follow-up is synced with the agent's latest setting
      await db.conversation.update({
        where: { id: conversation.id },
        data: { aiAutoReply: agent.missedCallAIFollowUp, status: "open" }
      })
    }

    // 4. Create the automated outbound message (The Text-Back)
    const textBackMessage = agent.missedCallMessage || "Hi, sorry we missed your call. How can we help?"
    
    await db.message.create({
      data: {
        conversationId: conversation.id,
        isOutbound: true,
        content: textBackMessage,
        status: "delivered"
      }
    })

    // Trigger UI update for the inbox
    await pusherServer.trigger(`agency-${agencyId}`, "chat_update", {
      conversationId: conversation.id
    })

    await pusherServer.trigger(`agency-${agencyId}`, "notification", {
      id: Math.random().toString(),
      title: "Missed Call Auto-Reply Sent",
      body: `Sent to ${contact.firstName} (${from})`,
      type: "system",
      createdAt: new Date(),
      read: false
    })

    return NextResponse.json({ success: true, message: "Text-back triggered successfully" })

  } catch (error) {
    console.error("Missed call webhook error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
