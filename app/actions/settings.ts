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
    const updated = await db.agency.update({
      where: { id: auth.agencyId },       // always from session
      data: {
        logoUrl: branding.logoUrl,
        brandColors: branding.colors ? JSON.stringify(branding.colors) : undefined,
        customDomain: branding.customDomain || null,
        whiteLabelName: branding.whiteLabelName || null,
        loginBackgroundImage: branding.loginBackgroundImage || null
      }
    })

    revalidatePath("/settings/branding")
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
    return { success: true, agency }
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
}) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const updated = await db.agency.update({
      where: { id: auth.agencyId },
      data: {
        name: data.name.trim(),
        whiteLabelName: data.whiteLabelName?.trim() || null,
        subdomain: data.subdomain?.trim().toLowerCase() || undefined,
        customDomain: data.customDomain?.trim() || null,
        missedCallEnabled: data.missedCallEnabled !== undefined ? data.missedCallEnabled : undefined,
        missedCallMessage: data.missedCallMessage !== undefined ? data.missedCallMessage : undefined
      }
    })

    revalidatePath("/settings")
    return { success: true, agency: updated }
  } catch (error: any) {
    return { success: false, error: error.message }
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
