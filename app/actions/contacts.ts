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
