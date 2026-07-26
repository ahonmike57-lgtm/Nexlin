"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function seedDemoAgencyData() {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const agencyId = auth.agencyId

    const sampleContacts = [
      { firstName: "Alex", lastName: "Morgan", email: "alex.m@acmedental.com", phone: "+14155550192", company: "Acme Dental", leadScore: 85 },
      { firstName: "David", lastName: "Chen", email: "david@techcorp.io", phone: "+14155550193", company: "TechCorp", leadScore: 45 },
      { firstName: "Sarah", lastName: "Jenkins", email: "sarah@growthlabs.com", phone: "+14155550194", company: "Growth Labs", leadScore: 92 }
    ]

    for (const c of sampleContacts) {
      const existing = await db.contact.findFirst({
        where: { agencyId, email: c.email }
      })

      if (!existing) {
        await db.contact.create({
          data: { agencyId, ...c }
        })
      } else {
        await db.contact.update({
          where: { id: existing.id },
          data: { leadScore: c.leadScore }
        })
      }
    }

    const firstContact = await db.contact.findFirst({ where: { agencyId } })
    if (firstContact) {
      await db.deal.create({
        data: {
          agencyId,
          contactId: firstContact.id,
          title: "Enterprise SaaS Implementation Deal",
          value: 4970,
          stage: "negotiation"
        }
      })
    }

    revalidatePath("/dashboard")
    revalidatePath("/crm/contacts")
    revalidatePath("/crm/deals")

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
