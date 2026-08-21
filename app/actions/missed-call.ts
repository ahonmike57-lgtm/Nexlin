"use server"

import { db } from "@/lib/db"
import { withAgency } from "@/lib/tenant"
import { revalidatePath } from "next/cache"
import { sendSMS } from "./telephony"

export const getMissedCallSettings = withAgency(async ({ db, agencyId }) => {
  const agency = await db.agency.findUnique({
    where: { id: agencyId },
    select: {
      missedCallEnabled: true,
      missedCallMessage: true,
      name: true,
    }
  })

  const agent = await db.voiceAgent.findFirst({
    where: { agencyId, isActive: true },
    select: {
      missedCallAIFollowUp: true,
    }
  })

  return {
    enabled: agency?.missedCallEnabled ?? false,
    message: agency?.missedCallMessage || "Hi, this is [Agency Name]. We missed your call, how can we help?",
    aiFollowUp: agent?.missedCallAIFollowUp ?? false,
    agencyName: agency?.name || "Our Agency"
  }
})

export const updateMissedCallSettings = withAgency(
  async ({ db, agencyId }, data: {
    enabled: boolean
    message: string
    aiFollowUp?: boolean
    delaySeconds?: number
    workingHoursOnly?: boolean
  }) => {
    // 1. Update Agency level settings
    await db.agency.update({
      where: { id: agencyId },
      data: {
        missedCallEnabled: data.enabled,
        missedCallMessage: data.message,
      }
    })

    // 2. Update or upsert VoiceAgent level details
    const existingAgent = await db.voiceAgent.findFirst({
      where: { agencyId }
    })

    if (existingAgent) {
      await db.voiceAgent.update({
        where: { id: existingAgent.id },
        data: {
          missedCallEnabled: data.enabled,
          missedCallMessage: data.message,
          missedCallAIFollowUp: data.aiFollowUp ?? false,
        }
      })
    } else {
      await db.voiceAgent.create({
        data: {
          agencyId,
          name: "Default Inbound Receptionist",
          missedCallEnabled: data.enabled,
          missedCallMessage: data.message,
          missedCallAIFollowUp: data.aiFollowUp ?? false,
        }
      })
    }

    revalidatePath("/settings/missed-call")
    revalidatePath("/voice")
    return { success: true }
  },
  { role: "admin" }
)

export const testMissedCallTextBack = withAgency(
  async ({ db, agencyId }, testPhoneNumber: string) => {
    if (!testPhoneNumber) throw new Error("Phone number required")

    const agency = await db.agency.findUnique({
      where: { id: agencyId },
      select: { name: true, missedCallMessage: true }
    })

    const agencyName = agency?.name || "Our Business"
    const template = agency?.missedCallMessage || "Hi, this is [Agency Name]. We missed your call, how can we help?"
    const formattedMessage = template.replace(/\[Agency Name\]/g, agencyName)

    // Find or create test contact
    let contact = await db.contact.findFirst({
      where: { agencyId, phone: testPhoneNumber }
    })

    if (!contact) {
      contact = await db.contact.create({
        data: {
          agencyId,
          firstName: "Test",
          lastName: "Caller",
          phone: testPhoneNumber
        }
      })
    }

    const res = await sendSMS(contact.id, formattedMessage)
    return { success: true, message: formattedMessage, delivery: res }
  }
)
