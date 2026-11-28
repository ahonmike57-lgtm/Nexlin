"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function importCalendlyConfig(calendlyApiToken: string) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  const token = (calendlyApiToken || "").trim()
  if (!token) {
    return { success: false, error: "A valid Calendly personal access token is required." }
  }

  try {
    const userRes = await fetch("https://api.calendly.com/users/me", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!userRes.ok) {
      return {
        success: false,
        error: `Calendly authentication failed (HTTP ${userRes.status}). Check your API token.`,
      }
    }

    const userJson = await userRes.json()
    const userUri = userJson?.resource?.uri
    if (!userUri) {
      return { success: false, error: "Could not resolve Calendly user profile." }
    }

    const eventsRes = await fetch(
      `https://api.calendly.com/event_types?user=${encodeURIComponent(userUri)}&active=true`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!eventsRes.ok) {
      return {
        success: false,
        error: `Failed to fetch Calendly event types (HTTP ${eventsRes.status}).`,
      }
    }

    const eventsJson = await eventsRes.json()
    const collection = Array.isArray(eventsJson?.collection) ? eventsJson.collection : []

    if (collection.length === 0) {
      return { success: false, error: "No active Calendly event types found on this account." }
    }

    for (const evt of collection) {
      await db.snapshot.create({
        data: {
          agencyId: auth.agencyId,
          name: `Imported Calendly: ${evt.name || "Event Type"}`,
          version: "calendar_config",
          description: JSON.stringify({
            duration: evt.duration || 30,
            schedulingUrl: evt.scheduling_url || null,
            calendlyUri: evt.uri || null,
            importedAt: new Date().toISOString(),
            source: "calendly",
          }),
        },
      })
    }

    revalidatePath("/calendar")
    return { success: true, count: collection.length }
  } catch (error: any) {
    return { success: false, error: error?.message || "Calendly import failed" }
  }
}
