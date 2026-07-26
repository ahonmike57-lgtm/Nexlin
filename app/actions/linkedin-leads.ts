"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function ingestLinkedInLead(data: {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  formName?: string
  campaignName?: string
  utmSource?: string
}) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const cleanEmail = data.email.trim().toLowerCase()

    let contact = await db.contact.findFirst({
      where: {
        agencyId: auth.agencyId,
        email: cleanEmail
      }
    })

    if (!contact) {
      contact = await db.contact.create({
        data: {
          agencyId: auth.agencyId,
          email: cleanEmail,
          firstName: data.firstName || "LinkedIn Lead",
          lastName: data.lastName || "",
          phone: data.phone || undefined
        }
      })
    }

    revalidatePath("/crm/contacts")
    return { success: true, contact }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
