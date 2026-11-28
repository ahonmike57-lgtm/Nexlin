"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

function parseJsonSafe(raw: string | null | undefined): Record<string, any> {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

export async function getBrandingSettings() {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const [agency, snapshot] = await Promise.all([
      db.agency.findUnique({
        where: { id: auth.agencyId },
        select: {
          name: true,
          whiteLabelName: true,
          customDomain: true,
          logoUrl: true,
          brandColors: true
        }
      }),
      db.snapshot.findFirst({
        where: { agencyId: auth.agencyId, name: "white_label_branding" }
      })
    ])

    const agencyColors = parseJsonSafe(agency?.brandColors)
    const snapshotData = parseJsonSafe(snapshot?.description)

    const branding = {
      companyName: agency?.whiteLabelName || snapshotData.companyName || agency?.name || "NEXLIN Agency",
      customDomain: agency?.customDomain ?? snapshotData.customDomain ?? "",
      primaryColor: agencyColors.primary || snapshotData.primaryColor || "#1A3CFF",
      accentColor: agencyColors.accent || snapshotData.accentColor || "#F5A623",
      logoUrl: agency?.logoUrl ?? snapshotData.logoUrl ?? "",
      faviconUrl: snapshotData.faviconUrl || "",
      smtpHost: snapshotData.smtpHost || "smtp.sendgrid.net",
      smtpPort: snapshotData.smtpPort || "587",
      smtpUser: snapshotData.smtpUser || "apikey"
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
    const existingAgency = await db.agency.findUnique({
      where: { id: auth.agencyId },
      select: { brandColors: true }
    })

    const existingColors = parseJsonSafe(existingAgency?.brandColors)
    const mergedColors = {
      ...existingColors,
      primary: data.primaryColor || "#1A3CFF",
      accent: data.accentColor || "#F5A623"
    }

    const cleanCustomDomain = data.customDomain?.trim() || null

    try {
      await db.agency.update({
        where: { id: auth.agencyId },
        data: {
          whiteLabelName: data.companyName?.trim() || null,
          customDomain: cleanCustomDomain,
          logoUrl: data.logoUrl?.trim() || null,
          brandColors: JSON.stringify(mergedColors)
        }
      })
    } catch (err: any) {
      if (err?.code === "P2002") {
        return {
          success: false,
          error: "That custom domain is already in use by another workspace."
        }
      }
      throw err
    }

    const existing = await db.snapshot.findFirst({
      where: { agencyId: auth.agencyId, name: "white_label_branding" }
    })

    const {
      smtpPassword: _smtpPassword,
      password: _password,
      secret: _secret,
      token: _token,
      ...safeSnapshotData
    } = (data && typeof data === "object" ? data : {}) as Record<string, any>

    if (existing) {
      await db.snapshot.update({
        where: { id: existing.id },
        data: { description: JSON.stringify(safeSnapshotData) }
      })
    } else {
      await db.snapshot.create({
        data: {
          agencyId: auth.agencyId,
          name: "white_label_branding",
          version: "v1",
          description: JSON.stringify(safeSnapshotData)
        }
      })
    }

    revalidatePath("/settings/branding")
    revalidatePath("/settings")
    revalidatePath("/", "layout")
    return { success: true, message: "Branding settings saved successfully!" }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}