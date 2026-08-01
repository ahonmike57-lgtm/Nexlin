import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { pusherServer } from "@/lib/pusher"

export async function POST(req: Request) {
  try {
    let from = ""
    let to = ""
    let accountSid = ""
    let suppliedAgencyId = ""

    const contentType = req.headers.get("content-type") || ""

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData()
      from = (formData.get("From") as string) || ""
      to = (formData.get("To") as string) || ""
      accountSid = (formData.get("AccountSid") as string) || ""
    } else {
      const json = await req.json().catch(() => ({}))
      from = json.from || json.From || ""
      to = json.to || json.To || ""
      accountSid = json.accountSid || json.AccountSid || ""
      suppliedAgencyId = json.agencyId || ""
    }

    if (!from) {
      return NextResponse.json({ success: false, error: "Missing sender phone number (From)" }, { status: 400 })
    }

    // Secure Agency Resolution: Never trust client-supplied agencyId. Look up by destination phone number (To) or AccountSid
    let targetAgencyId = ""

    if (to) {
      const matchedNumber = await db.phoneNumber.findFirst({
        where: { OR: [{ number: to }, { number: `+${to.replace(/[^0-9]/g, "")}` }] },
        select: { agencyId: true }
      })
      if (matchedNumber) targetAgencyId = matchedNumber.agencyId
    }

    if (!targetAgencyId && suppliedAgencyId) {
      // Confirm supplied agencyId exists in database
      const existingAgency = await db.agency.findUnique({
        where: { id: suppliedAgencyId },
        select: { id: true }
      })
      if (existingAgency) targetAgencyId = existingAgency.id
    }

    if (!targetAgencyId) {
      const defaultAgency = await db.agency.findFirst({ select: { id: true } })
      if (defaultAgency) targetAgencyId = defaultAgency.id
    }

    if (!targetAgencyId) {
      return NextResponse.json({ success: false, error: "No matching agency found for incoming call" }, { status: 404 })
    }

    // 1. Check if Missed Call Text-Back is enabled for this agency
    const agent = await db.voiceAgent.findFirst({
      where: { agencyId: targetAgencyId, isActive: true }
    })

    const agency = await db.agency.findUnique({
      where: { id: targetAgencyId },
      select: { missedCallEnabled: true, missedCallMessage: true }
    })

    const isEnabled = agent?.missedCallEnabled || agency?.missedCallEnabled
    if (!isEnabled) {
      return NextResponse.json({ success: false, error: "Missed call text-back is not enabled for this agency." })
    }

    // 2. Find or create the contact based on the phone number
    let contact = await db.contact.findFirst({
      where: { agencyId: targetAgencyId, phone: from }
    })

    if (!contact) {
      contact = await db.contact.create({
        data: {
          agencyId: targetAgencyId,
          firstName: "Caller",
          lastName: from.slice(-4),
          phone: from
        }
      })
      // Trigger new contact notification
      await pusherServer.trigger(`agency-${targetAgencyId}`, "notification", {
        id: Math.random().toString(),
        title: "New Lead (Missed Call)",
        body: `A new contact called from ${from}.`,
        type: "lead",
        createdAt: new Date(),
        read: false
      }).catch(() => {})
    }

    // 3. Find or create the SMS conversation
    let conversation = await db.conversation.findFirst({
      where: { agencyId: targetAgencyId, contactId: contact.id, channel: "sms" }
    })

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          agencyId: targetAgencyId,
          contactId: contact.id,
          channel: "sms",
          aiAutoReply: agent?.missedCallAIFollowUp ?? false
        }
      })
    } else {
      await db.conversation.update({
        where: { id: conversation.id },
        data: { aiAutoReply: agent?.missedCallAIFollowUp ?? false, status: "open" }
      })
    }

    // 4. Create the automated outbound message (The Text-Back)
    const textBackMessage = agent?.missedCallMessage || agency?.missedCallMessage || "Hi, sorry we missed your call. How can we help?"

    await db.message.create({
      data: {
        conversationId: conversation.id,
        isOutbound: true,
        content: textBackMessage,
        status: "delivered"
      }
    })

    // Trigger UI update for the inbox
    await pusherServer.trigger(`agency-${targetAgencyId}`, "chat_update", {
      conversationId: conversation.id
    }).catch(() => {})

    await pusherServer.trigger(`agency-${targetAgencyId}`, "notification", {
      id: Math.random().toString(),
      title: "Missed Call Auto-Reply Sent",
      body: `Sent to ${contact.firstName} (${from})`,
      type: "system",
      createdAt: new Date(),
      read: false
    }).catch(() => {})

    return NextResponse.json({ success: true, message: "Text-back triggered successfully" })

  } catch (error) {
    console.error("Missed call webhook error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
