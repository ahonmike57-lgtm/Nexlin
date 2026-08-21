"use server"

import { revalidatePath } from "next/cache"
import { withAgency } from "@/lib/tenant"
import { triggerWorkflows } from "./workflow-engine"
import { getActiveSubAccountId } from "./subaccounts"

export const getContacts = withAgency(async ({ db, userId, userRole }) => {
  const subAgencyId = await getActiveSubAccountId()

  const whereClause: any = {}
  if (subAgencyId) {
    whereClause.subAgencyId = subAgencyId
  }

  // Server-side Tenant User Scoping: If user is staff/rep (not owner/admin), scope strictly to leads assigned to them
  const isStaffOnly = userId && userRole && !userRole.toLowerCase().includes("owner") && !userRole.toLowerCase().includes("admin")
  if (isStaffOnly) {
    whereClause.assignedRepId = userId
  }

  return db.contact.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: { assignedRep: { select: { id: true, name: true, email: true } } }
  })
})

export const createContact = withAgency(
  async ({ db, agencyId }, data: { firstName: string, lastName?: string, email?: string, phone?: string, company?: string }) => {
    const subAgencyId = await getActiveSubAccountId()

    const contact = await db.contact.create({
      data: {
        agencyId,
        subAgencyId,
        ...data
      }
    })

    // Trigger any active workflows for contact creation
    await triggerWorkflows(agencyId, "contact_created", { contactId: contact.id })

    revalidatePath("/crm/contacts")
    return contact
  }
)

export const deleteContact = withAgency(
  async ({ db }, id: string) => {
    const deleted = await db.contact.deleteMany({
      where: { id }
    })

    if (deleted.count === 0) {
      throw new Error("Contact not found or access denied")
    }

    revalidatePath("/crm/contacts")
    return { id }
  },
  { role: "admin" }
)

/**
 * GDPR / CCPA Full Data Portability Export
 */
export const exportContactData = withAgency(
  async ({ db }, contactId: string) => {
    const contact = await db.contact.findFirst({
      where: { id: contactId },
      include: {
        deals: true,
        conversations: { include: { messages: true } },
        appointments: true,
        reviews: true,
        reviewRequests: true,
        formSubmissions: true
      }
    })

    if (!contact) throw new Error("Contact not found")

    return {
      exportedAt: new Date().toISOString(),
      format: "GDPR_CCPA_PORTABILITY_V1",
      contact
    }
  }
)

/**
 * GDPR "Right to be Forgotten" - Cryptographic Anonymization
 */
export const anonymizeContact = withAgency(
  async ({ db }, contactId: string) => {
    const contact = await db.contact.findFirst({ where: { id: contactId } })
    if (!contact) throw new Error("Contact not found")

    const crypto = require("crypto")
    const hash = crypto.createHash("sha256").update(contact.id).digest("hex").slice(0, 8)

    await db.contact.updateMany({
      where: { id: contactId },
      data: {
        firstName: "Anonymized",
        lastName: `User-${hash}`,
        email: `anonymized-${hash}@deleted.gdpr`,
        phone: null,
        company: null,
        tags: "gdpr_anonymized",
        dndEnabled: true,
        emailSuppressed: true,
        deletedAt: new Date()
      }
    })

    revalidatePath("/crm/contacts")
    return { success: true, anonymizedId: contactId }
  },
  { role: "admin" }
)

/**
 * Trigger Asynchronous CSV Bulk Lead Import Worker
 */
export const triggerBulkImportJob = withAgency(
  async ({ agencyId }, rows: any[], tags?: string) => {
    const { inngest } = require("@/lib/inngest/client")
    await inngest.send({
      name: "contacts.bulk_import",
      data: {
        agencyId,
        rows,
        tags: tags || "csv_import"
      }
    })

    return { success: true, queuedRows: rows.length }
  }
)

