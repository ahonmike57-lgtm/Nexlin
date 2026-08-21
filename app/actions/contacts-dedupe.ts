"use server"

import { revalidatePath } from "next/cache"
import { withAgency } from "@/lib/tenant"

export const findDuplicateContacts = withAgency(async ({ db }) => {
  const contacts = await db.contact.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      createdAt: true,
    }
  })

  const emailGroups: Record<string, typeof contacts> = {}
  const phoneGroups: Record<string, typeof contacts> = {}

  for (const c of contacts) {
    if (c.email) {
      const cleanEmail = c.email.trim().toLowerCase()
      if (!emailGroups[cleanEmail]) emailGroups[cleanEmail] = []
      emailGroups[cleanEmail].push(c)
    }
    if (c.phone) {
      const cleanPhone = c.phone.replace(/[^0-9+]/g, "")
      if (cleanPhone.length > 5) {
        if (!phoneGroups[cleanPhone]) phoneGroups[cleanPhone] = []
        phoneGroups[cleanPhone].push(c)
      }
    }
  }

  const duplicates: Array<{ field: string; value: string; contacts: typeof contacts }> = []

  for (const [email, list] of Object.entries(emailGroups)) {
    if (list.length > 1) {
      duplicates.push({ field: "email", value: email, contacts: list })
    }
  }

  for (const [phone, list] of Object.entries(phoneGroups)) {
    if (list.length > 1) {
      const ids = new Set(list.map(c => c.id))
      const alreadyAdded = duplicates.some(d => d.contacts.some(c => ids.has(c.id)))
      if (!alreadyAdded) {
        duplicates.push({ field: "phone", value: phone, contacts: list })
      }
    }
  }

  return duplicates
})

export const mergeContacts = withAgency(
  async ({ db, agencyId }, targetContactId: string, sourceContactIds: string[]) => {
    const target = await db.contact.findFirst({
      where: { id: targetContactId }
    })
    if (!target) {
      throw new Error("Target contact not found or access denied")
    }

    for (const sourceId of sourceContactIds) {
      if (sourceId === targetContactId) continue

      await db.deal.updateMany({
        where: { contactId: sourceId },
        data: { contactId: targetContactId }
      })

      await db.appointment.updateMany({
        where: { contactId: sourceId },
        data: { contactId: targetContactId }
      })

      await db.conversation.updateMany({
        where: { contactId: sourceId },
        data: { contactId: targetContactId }
      })

      await db.contact.deleteMany({
        where: { id: sourceId }
      })
    }

    revalidatePath("/crm/contacts")
    return { targetContactId }
  },
  { role: "admin" }
)

export const autoMergeAllDuplicates = withAgency(
  async ({ db, agencyId }) => {
    const contacts = await db.contact.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      }
    })

    const emailGroups: Record<string, typeof contacts> = {}
    const phoneGroups: Record<string, typeof contacts> = {}

    for (const c of contacts) {
      if (c.email) {
        const cleanEmail = c.email.trim().toLowerCase()
        if (!emailGroups[cleanEmail]) emailGroups[cleanEmail] = []
        emailGroups[cleanEmail].push(c)
      }
      if (c.phone) {
        const cleanPhone = c.phone.replace(/[^0-9+]/g, "")
        if (cleanPhone.length > 5) {
          if (!phoneGroups[cleanPhone]) phoneGroups[cleanPhone] = []
          phoneGroups[cleanPhone].push(c)
        }
      }
    }

    let mergedCount = 0
    const processedIds = new Set<string>()

    // Merge email groups
    for (const [_, list] of Object.entries(emailGroups)) {
      if (list.length > 1) {
        const target = list[0]
        const sources = list.slice(1).map(c => c.id).filter(id => !processedIds.has(id))

        if (sources.length > 0) {
          for (const srcId of sources) {
            try {
              await db.deal.updateMany({ where: { contactId: srcId }, data: { contactId: target.id } })
              await db.appointment.updateMany({ where: { contactId: srcId }, data: { contactId: target.id } })
              await db.conversation.updateMany({ where: { contactId: srcId }, data: { contactId: target.id } })
              await db.contact.deleteMany({ where: { id: srcId } })
              processedIds.add(srcId)
              mergedCount++
            } catch (e) {
              console.warn(`autoMerge: skipped source ${srcId} due to error:`, e)
            }
          }
        }
      }
    }

    // Merge phone groups
    for (const [_, list] of Object.entries(phoneGroups)) {
      const validList = list.filter(c => !processedIds.has(c.id))
      if (validList.length > 1) {
        const target = validList[0]
        const sources = validList.slice(1).map(c => c.id).filter(id => !processedIds.has(id))

        if (sources.length > 0) {
          for (const srcId of sources) {
            try {
              await db.deal.updateMany({ where: { contactId: srcId }, data: { contactId: target.id } })
              await db.appointment.updateMany({ where: { contactId: srcId }, data: { contactId: target.id } })
              await db.conversation.updateMany({ where: { contactId: srcId }, data: { contactId: target.id } })
              await db.contact.deleteMany({ where: { id: srcId } })
              processedIds.add(srcId)
              mergedCount++
            } catch (e) {
              console.warn(`autoMerge: skipped source ${srcId} due to error:`, e)
            }
          }
        }
      }
    }

    revalidatePath("/crm/contacts")
    revalidatePath("/crm/contacts/dedupe")
    return { success: true, mergedCount }
  },
  { role: "admin" }
)

