"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getOrCreateAgency } from "./agency"
import { triggerWorkflows } from "./workflow-engine"
import { getActiveSubAccountId } from "./subaccounts"

export async function getContacts() {
  try {
    const agencyId = await getOrCreateAgency()
    const subAgencyId = await getActiveSubAccountId()
    
    const whereClause: any = { agencyId }
    if (subAgencyId) {
      whereClause.subAgencyId = subAgencyId
    }

    const contacts = await db.contact.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    })
    return { success: true, data: contacts }
  } catch (error) {
    console.error("Failed to fetch contacts:", error)
    return { success: false, error: "Failed to fetch contacts" }
  }
}

export async function createContact(data: { firstName: string, lastName?: string, email?: string, phone?: string, company?: string }) {
  try {
    const agencyId = await getOrCreateAgency()
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
    return { success: true, data: contact }
  } catch (error: any) {
    console.error("Failed to create contact:", error)
    return { success: false, error: error.message || "Failed to create contact" }
  }
}
