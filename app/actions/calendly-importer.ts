"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function importCalendlyConfig(calendlyApiToken: string) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    // Simulated fetch of Calendly Event Types
    const importedEvents = [
      { name: "30-Min Strategy Call", duration: 30 },
      { name: "15-Min Quick Consultation", duration: 15 },
      { name: "60-Min Full Onboarding", duration: 60 }
    ]

    for (const evt of importedEvents) {
      await db.snapshot.create({
        data: {
          agencyId: auth.agencyId,
          name: `Imported Calendly: ${evt.name}`,
          version: "calendar_config",
          description: JSON.stringify({
            duration: evt.duration,
            importedAt: new Date().toISOString(),
            source: "calendly"
          })
        }
      })
    }

    revalidatePath("/calendar")
    return { success: true, count: importedEvents.length }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
