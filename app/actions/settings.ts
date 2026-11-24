"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { requireTenantAuth } from "@/lib/permissions"
import { getActiveSubAccountId } from "./subaccounts"

// ─── Branding ───────────────────────────────────────────────────────────────

export async function getAgencyBranding() {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const agency = await db.agency.findUnique({
      where: { id: auth.agencyId },       // always from session
      select: {
        name: true,
        logoUrl: true,
        brandColors: true,
        subdomain: true,
        customDomain: true,
        whiteLabelName: true,
        loginBackgroundImage: true
      }
    })
    return { success: true, data: agency }
  } catch (error) {
    console.error("Failed to fetch branding:", error)
    return { success: false, error: "Failed to fetch branding" }
  }
}

export async function updateAgencyBranding(branding: {
  logoUrl?: string
  colors?: any
  customDomain?: string
  whiteLabelName?: string
  loginBackgroundImage?: string
}) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    let brandColorsValue: string | undefined = undefined
    if (branding.colors) {
      const existing = await db.agency.findUnique({
        where: { id: auth.agencyId },
        select: { brandColors: true }
      })
      let existingColors: Record<string, any> = {}
      if (existing?.brandColors) {
        try {
          existingColors = JSON.parse(existing.brandColors)
        } catch {}
      }
      brandColorsValue = JSON.stringify({ ...existingColors, ...branding.colors })
    }

    const updated = await db.agency.update({
      where: { id: auth.agencyId },       // always from session
      data: {
        logoUrl: branding.logoUrl,
        brandColors: brandColorsValue,
        customDomain: branding.customDomain || null,
        whiteLabelName: branding.whiteLabelName || null,
        loginBackgroundImage: branding.loginBackgroundImage || null
      }
    })

    revalidatePath("/settings/branding")
    revalidatePath("/", "layout")
    return { success: true, data: updated }
  } catch (error: any) {
    console.error("Failed to update branding:", error)
    return { success: false, error: error.message || "Failed to update branding" }
  }
}

// ─── Team Members ────────────────────────────────────────────────────────────

export async function getTeamMembers() {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const subAgencyId = await getActiveSubAccountId()
    const whereClause: any = { agencyId: auth.agencyId }   // always from session
    if (subAgencyId) {
      whereClause.subAgencyId = subAgencyId
    }

    const members = await db.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })
    return { success: true, data: members }
  } catch (error) {
    console.error("Failed to fetch team:", error)
    return { success: false, error: "Failed to fetch team members" }
  }
}

export async function inviteTeamMember(email: string, role: string) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const subAgencyId = await getActiveSubAccountId()

    // Check for duplicate
    const existing = await db.user.findFirst({
      where: { email: email.trim().toLowerCase(), agencyId: auth.agencyId }
    })
    if (existing) {
      return { success: false, error: "A team member with this email already exists." }
    }

    // In production this would send an email invite.
    // For now we create a stub user with no passwordHash — they must set password via invite link.
    const user = await db.user.create({
      data: {
        agencyId: auth.agencyId,          // always from session
        subAgencyId,
        email: email.trim().toLowerCase(),
        role,
        name: email.split("@")[0]
      }
    })

    revalidatePath("/settings/team")
    return { success: true, data: user }
  } catch (error: any) {
    console.error("Failed to invite member:", error)
    return { success: false, error: error.message || "Failed to invite member" }
  }
}

// ─── General Settings ────────────────────────────────────────────────────────

export async function getAgencySettings() {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const agency = await db.agency.findUnique({
      where: { id: auth.agencyId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        customDomain: true,
        whiteLabelName: true,
        logoUrl: true,
        brandColors: true,
        planTier: true,
        status: true,
        missedCallEnabled: true,
        missedCallMessage: true,
        createdAt: true
      }
    })

    let timezone = "America/New_York"
    let currency = "USD"
    if (agency?.brandColors) {
      try {
        const parsed = JSON.parse(agency.brandColors)
        if (parsed.timezone) timezone = parsed.timezone
        if (parsed.currency) currency = parsed.currency
      } catch {}
    }

    return {
      success: true,
      agency: {
        ...agency,
        timezone,
        currency
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateAgencyProfile(data: {
  name: string
  whiteLabelName?: string
  subdomain?: string
  customDomain?: string
  missedCallEnabled?: boolean
  missedCallMessage?: string
  timezone?: string
  currency?: string
  logoUrl?: string
}) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const existing = await db.agency.findUnique({
      where: { id: auth.agencyId },
      select: { brandColors: true }
    })

    let brandMeta: any = {}
    if (existing?.brandColors) {
      try {
        brandMeta = JSON.parse(existing.brandColors)
      } catch {}
    }

    if (data.timezone) brandMeta.timezone = data.timezone
    if (data.currency) brandMeta.currency = data.currency

    const updated = await db.agency.update({
      where: { id: auth.agencyId },
      data: {
        name: data.name.trim(),
        whiteLabelName: data.whiteLabelName?.trim() || null,
        subdomain: data.subdomain?.trim().toLowerCase() || undefined,
        customDomain: data.customDomain?.trim() || null,
        logoUrl: data.logoUrl !== undefined ? data.logoUrl : undefined,
        brandColors: JSON.stringify(brandMeta),
        missedCallEnabled: data.missedCallEnabled !== undefined ? data.missedCallEnabled : undefined,
        missedCallMessage: data.missedCallMessage !== undefined ? data.missedCallMessage : undefined
      }
    })

    revalidatePath("/settings")
    revalidatePath("/settings/branding")
    revalidatePath("/", "layout")
    return { success: true, agency: updated }
  } catch (error: any) {
    if (error?.code === "P2002") {
      return { success: false, error: "Subdomain or custom domain is already in use." }
    }
    return { success: false, error: error.message }
  }
}

export async function exportAgencyData() {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const agencyId = auth.agencyId
    const [agency, contacts, deals, appointments, pipelines, workflows] = await Promise.all([
      db.agency.findUnique({
        where: { id: agencyId },
        select: { id: true, name: true, subdomain: true, planTier: true, createdAt: true }
      }),
      db.contact.findMany({ where: { agencyId }, orderBy: { createdAt: "desc" } }),
      db.deal.findMany({ where: { agencyId }, orderBy: { createdAt: "desc" } }),
      db.appointment.findMany({ where: { agencyId }, orderBy: { startTime: "desc" } }),
      db.pipeline.findMany({ where: { agencyId }, include: { stages: true } }),
      db.workflow.findMany({ where: { agencyId } })
    ])

    const exportPayload = {
      agency,
      exportedAt: new Date().toISOString(),
      counts: {
        contacts: contacts.length,
        deals: deals.length,
        appointments: appointments.length,
        pipelines: pipelines.length,
        workflows: workflows.length
      },
      contacts,
      deals,
      appointments,
      pipelines,
      workflows
    }

    return { success: true, data: exportPayload }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to export agency data" }
  }
}

export async function updateMissedCallTextBack(enabled: boolean, message: string) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    await db.agency.update({
      where: { id: auth.agencyId },
      data: {
        missedCallEnabled: enabled,
        missedCallMessage: message,
      }
    })

    revalidatePath("/settings")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
