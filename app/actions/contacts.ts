"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getOrCreateAgency } from "./agency"

export async function getContacts() {
  try {
    const agencyId = await getOrCreateAgency()
    const contacts = await db.contact.findMany({
      where: { agencyId },
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
    const contact = await db.contact.create({
      data: {
        agencyId,
        ...data
      }
    })
    
    revalidatePath("/crm/contacts")
    return { success: true, data: contact }
  } catch (error) {
    console.error("Failed to create contact:", error)
    return { success: false, error: "Failed to create contact" }
  }
}
