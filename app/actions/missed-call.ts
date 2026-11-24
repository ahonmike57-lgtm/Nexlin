"use server"

import { withAgency } from "@/lib/tenant"
import { revalidatePath } from "next/cache"
import { sendSMS } from "./telephony"

function parseJsonSafe(raw: string | null | undefined): Record<string, any> {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

export const getMissedCallSettings = withAgency(async ({ db, agencyId }) => {
  const agency = await db.agency.findUnique({
    where: { id: agencyId },
    select: {
      missedCallEnabled: true,
      missedCallMessage: true,
      brandColors: true,
      name: true,
    }
  })

  const agent = await db.voiceAgent.findFirst({
    where: { agencyId },
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    select: {
      missedCallAIFollowUp: true,
    }
  })

  const brandMeta = parseJsonSafe(agency?.brandColors)

  return {
    enabled: agency?.missedCallEnabled ?? false,
    message: agency?.missedCallMessage || "Hi, this is [Agency Name]. We missed your call, how can we help?",
    aiFollowUp: agent?.missedCallAIFollowUp ?? false,
    workingHoursOnly: !!brandMeta.workingHoursOnly,
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
    const agency = await db.agency.findUnique({
      where: { id: agencyId },
      select: { brandColors: true }
    })

    const brandMeta = parseJsonSafe(agency?.brandColors)
    if (data.workingHoursOnly !== undefined) {
      brandMeta.workingHoursOnly = data.workingHoursOnly
    }

    // 1. Update Agency level settings
    await db.agency.updateMany({
      where: { id: agencyId },
      data: {
        missedCallEnabled: data.enabled,
        missedCallMessage: data.message,
        brandColors: JSON.stringify(brandMeta),
      }
    })

    // 2. Update or upsert VoiceAgent level details
    const existingAgent = await db.voiceAgent.findFirst({
      where: { agencyId },
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }]
    })

    if (existingAgent) {
      await db.voiceAgent.updateMany({
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
          isActive: true,
          missedCallEnabled: data.enabled,
          missedCallMessage: data.message,
          missedCallAIFollowUp: data.aiFollowUp ?? false,
        }
      })
    }

    revalidatePath("/settings/missed-call")
    revalidatePath("/settings")
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

    const firstName = contact.firstName || "there"
    const formattedMessage = template
      .replace(/\[Agency Name\]/gi, agencyName)
      .replace(/\[First Name\]/gi, firstName)
      .replace(/\[Contact Name\]/gi, firstName)

    const res = await sendSMS(contact.id, formattedMessage)
    return { success: true, message: formattedMessage, delivery: res }
  }
)