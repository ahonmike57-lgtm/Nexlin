"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getContacts(agencyId: string) {
  try {
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

export async function createContact(agencyId: string, data: { firstName: string, lastName?: string, email?: string, phone?: string, company?: string }) {
  try {
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
