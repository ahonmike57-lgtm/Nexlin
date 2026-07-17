"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"
import { getActiveSubAccountId } from "./subaccounts"

export async function getAgencyBranding(agencyId: string) {
  try {
    const agency = await db.agency.findUnique({
      where: { id: agencyId },
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

export async function updateAgencyBranding(agencyId: string, branding: any) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const updated = await db.agency.update({
      where: { id: agencyId },
      data: {
        logoUrl: branding.logoUrl,
        brandColors: JSON.stringify(branding.colors),
        customDomain: branding.customDomain || null,
        whiteLabelName: branding.whiteLabelName || null,
        loginBackgroundImage: branding.loginBackgroundImage || null
      }
    })

    revalidatePath("/settings/branding")
    return { success: true, data: updated }
  } catch (error) {
    console.error("Failed to update branding:", error)
    return { success: false, error: "Failed to update branding" }
  }
}

export async function getTeamMembers(agencyId: string) {
  try {
    const subAgencyId = await getActiveSubAccountId()
    const whereClause: any = { agencyId }
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

export async function inviteTeamMember(agencyId: string, email: string, role: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const subAgencyId = await getActiveSubAccountId()

    // In a real app, this would send an email invite.
    // For now, we just create a stub user.
    const user = await db.user.create({
      data: {
        agencyId,
        subAgencyId,
        email,
        role,
        name: email.split("@")[0]
      }
    })

    revalidatePath("/settings/team")
    return { success: true, data: user }
  } catch (error) {
    console.error("Failed to invite member:", error)
    return { success: false, error: "Failed to invite member" }
  }
}

export async function getAgencySettings(agencyId: string) {
  try {
    const agency = await db.agency.findUnique({
      where: { id: agencyId },
      select: {
        missedCallEnabled: true,
        missedCallMessage: true,
      }
    })
    return { success: true, agency }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateMissedCallTextBack(agencyId: string, enabled: boolean, message: string) {
  try {
    await db.agency.update({
      where: { id: agencyId },
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
