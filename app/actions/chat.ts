"use server"

import { revalidatePath } from "next/cache"
import { withAgency } from "@/lib/tenant"
import { getActiveSubAccountId } from "./subaccounts"
import { generateAiReply } from "./ai"
import Pusher from "pusher"
import { deliverMessage, broadcastNewMessage, type Channel } from "@/lib/messaging"

// Meta WhatsApp Cloud API Error Resolver
export async function resolveMetaWhatsappError(errorCodeStr: string) {
  const code = errorCodeStr.replace(/[^0-9]/g, "")

  if (code === "3538221404" || code === "131047" || code.includes("3538221404")) {
    return {
      errorCode: code,
      title: "Meta WhatsApp: 24-Hour Customer Care Window Expired",
      cause: "Meta WhatsApp Cloud API restricts freeform text to 24 hours after the customer's last incoming message. After 24 hours, you must use a pre-approved Meta Template message until the customer replies.",
      resolutionSteps: [
        "1. Wait for the customer to reply on WhatsApp to reopen the 24-hour service window.",
        "2. Or switch the channel to SMS or Email to reach the contact immediately.",
        "3. Ensure your WhatsApp System User Token has 'whatsapp_business_messaging' and 'whatsapp_business_management' permissions in Meta Business Manager."
      ]
    }
  }

  return {
    errorCode: code || "UNKNOWN",
    title: `Meta WhatsApp Error ${code}`,
    cause: "Meta WhatsApp API authorization or phone number configuration issue.",
    resolutionSteps: [
      "1. Verify your WhatsApp Phone Number ID in Meta Developers Console.",
      "2. Confirm your Meta Permanent Token is saved in Settings -> API Keys / Integrations.",
      "3. Verify payment method attached to Meta WhatsApp Business Account (WABA)."
    ]
  }
}

export const getConversations = withAgency(async ({ db, agencyId }) => {
  const subAgencyId = await getActiveSubAccountId()

  const whereClause: any = {}
  if (subAgencyId) {
    whereClause.subAgencyId = subAgencyId
  }

  let conversations = await db.conversation.findMany({
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

  // If no conversations exist yet, auto-provision sample WhatsApp, SMS, and Email conversations
  if (conversations.length === 0) {
    let contact = await db.contact.findFirst({ where: {} })
    if (!contact) {
      contact = await db.contact.create({
        data: {
          agencyId,
          firstName: "Alex",
          lastName: "Morgan",
          email: "alex.morgan@acmedental.com",
          phone: "+14155550192",
          company: "Acme Dental",
          leadScore: 85
        }
      })
    }

    // Create WhatsApp conversation
    const waConv = await db.conversation.create({
      data: {
        agencyId,
        subAgencyId,
        contactId: contact.id,
        channel: "whatsapp"
      }
    })
    await db.message.create({
      data: {
        conversationId: waConv.id,
        content: "Hi! Thanks for reaching out via WhatsApp. How can we help Acme Dental today?",
        isOutbound: false,
        status: "delivered"
      }
    })

    // Create SMS conversation
    const smsConv = await db.conversation.create({
      data: {
        agencyId,
        subAgencyId,
        contactId: contact.id,
        channel: "sms"
      }
    })
    await db.message.create({
      data: {
        conversationId: smsConv.id,
        content: "SMS Alert: Your appointment is confirmed for tomorrow at 10:00 AM.",
        isOutbound: true,
        status: "delivered"
      }
    })

    conversations = await db.conversation.findMany({
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
  }

  return conversations
})

export const getMessages = withAgency(async ({ db }, conversationId: string) => {
  const messages = await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' }
  })
  return messages
})

export const sendMessage = withAgency(
  async (
    { db, agencyId },
    conversationId: string,
    content: string,
    channelOrIsOutbound?: Channel | boolean,
    isOutboundFlag?: boolean
  ) => {
    const isOutbound = typeof channelOrIsOutbound === "boolean" ? channelOrIsOutbound : (isOutboundFlag ?? true)
    const channelOverride = typeof channelOrIsOutbound === "string" ? channelOrIsOutbound : undefined

    const conv = await db.conversation.findFirst({
      where: { id: conversationId },
      include: { contact: true }
    })

    if (!conv) {
      throw new Error("Conversation not found")
    }

    const channelTag = (channelOverride || conv.channel || "whatsapp") as Channel

    // Perform real delivery if outbound
    if (isOutbound) {
      const delivery = await deliverMessage({
        agencyId,
        channel: channelTag,
        contact: conv.contact,
        content
      })

      if (!delivery.ok) {
        throw new Error(delivery.error || "Message delivery failed")
      }
    }

    const message = await db.message.create({
      data: {
        conversationId,
        content,
        isOutbound,
        status: "delivered"
      }
    })

    await db.conversation.update({
      where: { id: conversationId },
      data: {
        updatedAt: new Date(),
        ...(channelOverride && channelOverride !== conv.channel ? { channel: channelOverride } : {})
      }
    })

    // Broadcast real-time event via Pusher (fire-and-forget)
    broadcastNewMessage({
      id: message.id,
      conversationId: message.conversationId,
      content: message.content,
      isOutbound: message.isOutbound,
      status: message.status,
      createdAt: message.createdAt,
    })

    revalidatePath("/chat")

    // --- AI AUTO-RESPONDER LOGIC ---
    if (!isOutbound && conv?.aiAutoReply) {
      generateAiReply("chat", conversationId).then(async (aiRes) => {
        if (aiRes.success && aiRes.data) {
          await sendMessage(conversationId, aiRes.data, channelTag, true)
        }
      }).catch(err => console.error("AI AutoReply Error:", err))
    }

    return message
  }
)

export const createConversation = withAgency(
  async ({ db, agencyId }, contactId: string, channel: string = "sms") => {
    const subAgencyId = await getActiveSubAccountId()

    const whereClause: any = { contactId, channel }
    if (subAgencyId) {
      whereClause.subAgencyId = subAgencyId
    }

    let conversation = await db.conversation.findFirst({
      where: whereClause,
      include: { contact: true, messages: { orderBy: { createdAt: 'desc' }, take: 1 } }
    })

    if (!conversation) {
      const created = await db.conversation.create({
        data: {
          agencyId,
          subAgencyId,
          contactId,
          channel
        }
      })

      conversation = await db.conversation.findFirst({
        where: { id: created.id },
        include: { contact: true, messages: { orderBy: { createdAt: 'desc' }, take: 1 } }
      })
    }

    revalidatePath("/chat")
    return conversation
  }
)

export const createQuickContactAndConversation = withAgency(
  async ({ db, agencyId }, name: string, phoneOrEmail: string, channel: string) => {
    const subAgencyId = await getActiveSubAccountId()

    const names = name.trim().split(" ")
    const firstName = names[0] || "New"
    const lastName = names.slice(1).join(" ") || "Contact"
    const isEmail = phoneOrEmail.includes("@")

    let contact = await db.contact.findFirst({
      where: {
        agencyId,
        OR: [
          { phone: phoneOrEmail },
          { email: phoneOrEmail }
        ]
      }
    })

    if (!contact) {
      contact = await db.contact.create({
        data: {
          agencyId,
          subAgencyId,
          firstName,
          lastName,
          phone: isEmail ? undefined : phoneOrEmail,
          email: isEmail ? phoneOrEmail : undefined
        }
      })
    }

    const convRes = await createConversation(contact.id, channel)
    return convRes.success ? convRes.data : null
  }
)

export const toggleAiAutoReply = withAgency(
  async ({ db }, conversationId: string, enabled: boolean) => {
    await db.conversation.updateMany({
      where: { id: conversationId },
      data: { aiAutoReply: enabled }
    })

    revalidatePath("/chat")
    return { id: conversationId, enabled }
  }
)
