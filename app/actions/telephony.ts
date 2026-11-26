"use server"

import twilio from "twilio"
import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { encryptConfig, decryptConfig } from "@/lib/encryption"
import { deliverMessage } from "@/lib/messaging"
import { pusherServer } from "@/lib/pusher"
import { getActiveSubAccountId } from "./subaccounts"

export async function sendSMS(contactId: string, content: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const contact = await db.contact.findFirst({
      where: { id: contactId, agencyId: auth.agencyId }
    })
    if (!contact) {
      return { success: false, error: "Contact not found" }
    }
    if (!contact.phone) {
      return { success: false, error: "Contact does not have a phone number" }
    }
    if (contact.dndEnabled) {
      return { success: false, error: "Contact has opted out of SMS (DND enabled)." }
    }

    const delivery = await deliverMessage({
      agencyId: auth.agencyId,
      channel: "sms",
      contact,
      content,
    })

    if (!delivery.ok) {
      return { success: false, error: delivery.error || "Failed to send SMS" }
    }

    const subAgencyId = await getActiveSubAccountId()

    // Find or create SMS conversation
    const whereClause: any = {
      contactId: contact.id,
      agencyId: auth.agencyId,
      channel: "sms",
    }
    if (subAgencyId) {
      whereClause.subAgencyId = subAgencyId
    }

    let conversation = await db.conversation.findFirst({ where: whereClause })

    if (!conversation) {
      conversation = await db.conversation.create({
        data: { contactId: contact.id, agencyId: auth.agencyId, subAgencyId, channel: "sms" }
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

    return { success: true, data: newMessage, messageSid: delivery.providerId }
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
    const credSnapshot = await db.snapshot.findFirst({
      where: { agencyId: auth.agencyId, name: "channel_credentials" }
    })
    let creds: any = {}
    if (credSnapshot?.description) {
      try {
        creds = JSON.parse(decryptConfig(credSnapshot.description))
      } catch {}
    }

    const sid = creds?.twilioSid || process.env.TWILIO_ACCOUNT_SID?.trim() || null
    const token = creds?.twilioToken || process.env.TWILIO_AUTH_TOKEN?.trim() || null

    if (!sid || !token) {
      return {
        success: false,
        error: "Twilio credentials are not configured. Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to purchase numbers."
      }
    }

    const twilioClient = twilio(sid, token)
    const areaCodeInt = parseInt(areaCode.replace(/\D/g, "")) || 415
    const available = await twilioClient.availablePhoneNumbers("US").local.list({ areaCode: areaCodeInt, limit: 1 })

    if (!available || available.length === 0) {
      return { success: false, error: `No available phone numbers found in area code ${areaCodeInt}` }
    }

    const purchased = await twilioClient.incomingPhoneNumbers.create({
      phoneNumber: available[0].phoneNumber,
      friendlyName: `Nexlin Agency ${auth.agencyId}`
    })

    const newPhone = await db.phoneNumber.create({
      data: {
        agencyId: auth.agencyId,
        number: purchased.phoneNumber,
        status: "active",
        provider: "twilio"
      }
    })

    return { success: true, data: newPhone }
  } catch (error: any) {
    console.warn("Twilio phone purchase error:", error?.message || error)
    return { success: false, error: error?.message || "Failed to purchase number" }
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
    const encryptedPin = encryptConfig(data.accountPin)

    const portReq = await db.portRequest.create({
      data: {
        agencyId: auth.agencyId,
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

    const portRequests = rawRequests.map(r => ({
      ...r,
      accountPin: r.accountPin ? "••••" : null
    }))

    return { success: true, numbers, portRequests }
  } catch (error) {
    return { success: false, error: "Failed to fetch phone data" }
  }
}
