"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function getBrandingSettings() {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const snapshot = await db.snapshot.findFirst({
      where: { agencyId: auth.agencyId, name: "white_label_branding" }
    })

    const branding = snapshot?.description ? JSON.parse(snapshot.description) : {
      companyName: "NEXLIN Agency",
      customDomain: "crm.nexlin.site",
      primaryColor: "#1A3CFF",
      accentColor: "#F5A623",
      logoUrl: "",
      faviconUrl: "",
      smtpHost: "smtp.sendgrid.net",
      smtpPort: "587",
      smtpUser: "apikey"
    }

    return { success: true, data: branding }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function saveBrandingSettings(data: any) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const existing = await db.snapshot.findFirst({
      where: { agencyId: auth.agencyId, name: "white_label_branding" }
    })

    if (existing) {
      await db.snapshot.update({
        where: { id: existing.id },
        data: { description: JSON.stringify(data) }
      })
    } else {
      await db.snapshot.create({
        data: {
          agencyId: auth.agencyId,
          name: "white_label_branding",
          version: "v1",
          description: JSON.stringify(data)
        }
      })
    }

    revalidatePath("/settings/branding")
    return { success: true, message: "Branding settings saved successfully!" }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
