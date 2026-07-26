"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function findDuplicateContacts() {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const contacts = await db.contact.findMany({
      where: { agencyId: auth.agencyId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true,
      }
    })

    // Group by email and phone
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
        // Only add if not already matched as an email group duplicate pair
        const ids = new Set(list.map(c => c.id))
        const alreadyAdded = duplicates.some(d => d.contacts.some(c => ids.has(c.id)))
        if (!alreadyAdded) {
          duplicates.push({ field: "phone", value: phone, contacts: list })
        }
      }
    }

    return { success: true, duplicates }
  } catch (error: any) {
    console.error("Deduplication scan failed:", error)
    return { success: false, error: "Failed to scan for duplicate contacts" }
  }
}

export async function mergeContacts(targetContactId: string, sourceContactIds: string[]) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const agencyId = auth.agencyId

    // 1. Verify target contact belongs to caller's agency
    const target = await db.contact.findFirst({
      where: { id: targetContactId, agencyId }
    })
    if (!target) {
      return { success: false, error: "Target contact not found or access denied" }
    }

    // 2. Reassign deals, appointments, conversations to target contact
    for (const sourceId of sourceContactIds) {
      if (sourceId === targetContactId) continue

      await db.deal.updateMany({
        where: { contactId: sourceId, agencyId },
        data: { contactId: targetContactId }
      })

      await db.appointment.updateMany({
        where: { contactId: sourceId, agencyId },
        data: { contactId: targetContactId }
      })

      await db.conversation.updateMany({
        where: { contactId: sourceId, agencyId },
        data: { contactId: targetContactId }
      })

      // 3. Delete source contact safely within tenant boundaries
      await db.contact.deleteMany({
        where: { id: sourceId, agencyId }
      })
    }

    revalidatePath("/crm/contacts")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to merge contacts:", error)
    return { success: false, error: error.message || "Failed to merge contacts" }
  }
}
