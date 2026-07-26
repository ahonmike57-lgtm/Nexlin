"use server"

import twilio from "twilio"
import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { encryptConfig, decryptConfig } from "@/lib/encryption"
import { pusherServer } from "@/lib/pusher"
import { getActiveSubAccountId } from "./subaccounts"

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "AC_mock_sid"
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "mock_token"
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || "+1234567890"

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

export async function sendSMS(contactId: string, content: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
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

    const subAgencyId = await getActiveSubAccountId()

    // Find or create SMS conversation
    const whereClause: any = {
      contactId,
      agencyId: contact.agencyId,
      channel: "sms",
    }
    if (subAgencyId) {
      whereClause.subAgencyId = subAgencyId
    }

    let conversation = await db.conversation.findFirst({ where: whereClause })

    if (!conversation) {
      conversation = await db.conversation.create({
        data: { contactId, agencyId: contact.agencyId, subAgencyId, channel: "sms" }
      })
    }

    const newMessage = await db.message.create({
      data: { conversationId: conversation.id, content, isOutbound: true, status: "delivered" }
    })

    await db.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() }
    })

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


export async function buyPhoneNumber(areaCode: string) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    // Mock Twilio Purchase
    const mockNumber = "+1" + areaCode + Math.floor(1000000 + Math.random() * 9000000).toString()
    
    const newPhone = await db.phoneNumber.create({
      data: {
        agencyId: auth.agencyId,   // always from session
        number: mockNumber,
        status: "active",
        provider: "twilio"
      }
    })

    return { success: true, data: newPhone }
  } catch (error) {
    return { success: false, error: "Failed to purchase number" }
  }
}

export async function submitPortRequest(data: {
  numberToPort: string
  currentCarrier: string
  accountNumber: string
  accountPin: string
}) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    // Encrypt the carrier account PIN before storing — it's sensitive credential data
    const encryptedPin = encryptConfig(data.accountPin)

    const portReq = await db.portRequest.create({
      data: {
        agencyId: auth.agencyId,   // always from session
        numberToPort: data.numberToPort,
        currentCarrier: data.currentCarrier,
        accountNumber: data.accountNumber,
        accountPin: encryptedPin,
        status: "pending"
      }
    })

    await db.phoneNumber.create({
      data: {
        agencyId: auth.agencyId,
        number: data.numberToPort,
        status: "porting",
        provider: "twilio"
      }
    })

    return { success: true, data: portReq }
  } catch (error) {
    return { success: false, error: "Failed to submit port request" }
  }
}

export async function getAgencyPhoneData() {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const numbers = await db.phoneNumber.findMany({ where: { agencyId: auth.agencyId } })
    const rawRequests = await db.portRequest.findMany({ where: { agencyId: auth.agencyId } })

    // Mask account PIN — never send decrypted PIN to client
    const portRequests = rawRequests.map(r => ({
      ...r,
      accountPin: r.accountPin ? "••••" : null
    }))

    return { success: true, numbers, portRequests }
  } catch (error) {
    return { success: false, error: "Failed to fetch phone data" }
  }
}

