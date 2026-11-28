"use server"

import crypto from "crypto"
import { Resend } from "resend"
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
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        passwordHash: true,
      }
    })
    return {
      success: true,
      data: members.map(({ passwordHash, ...member }) => ({
        ...member,
        status: passwordHash ? ("active" as const) : ("pending" as const),
      }))
    }
  } catch (error) {
    console.error("Failed to fetch team:", error)
    return { success: false, error: "Failed to fetch team members" }
  }
}

const ALLOWED_TEAM_ROLES = new Set([
  "Team Member",
  "Agency Admin",
  "Sales Rep",
  "Support Agent",
  "Read Only",
])

async function issueTeamInviteTokenAndEmail(params: {
  email: string
  agencyId: string
  role: string
}): Promise<{ emailSent: boolean; inviteUrl: string }> {
  const cleanEmail = params.email.trim().toLowerCase()
  const rawToken = crypto.randomBytes(24).toString("hex")
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex")
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await db.verificationToken.deleteMany({
    where: { identifier: cleanEmail },
  })

  await db.verificationToken.create({
    data: {
      identifier: cleanEmail,
      token: tokenHash,
      expires,
    },
  })

  const appUrl = (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://nexlin-virid.vercel.app"
  ).replace(/\/$/, "")

  const inviteUrl = `${appUrl}/reset-password?token=${encodeURIComponent(rawToken)}`

  const resendKey = process.env.RESEND_API_KEY?.trim()
  if (!resendKey) {
    return { emailSent: false, inviteUrl }
  }

  try {
    const agency = await db.agency.findUnique({
      where: { id: params.agencyId },
      select: { name: true, whiteLabelName: true },
    })
    const workspaceName = (agency?.whiteLabelName || agency?.name || "Nexlin").replace(/[<>]/g, "")
    const safeRole = params.role.replace(/[<>]/g, "")

    const resend = new Resend(resendKey)
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Nexlin <onboarding@resend.dev>",
      to: cleanEmail,
      subject: `You've been invited to join ${workspaceName} on Nexlin`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="margin-bottom: 12px;">You're invited to ${workspaceName}</h2>
          <p>You have been added as <strong>${safeRole}</strong>. Set your password to activate your account and sign in:</p>
          <div style="margin: 28px 0;">
            <a href="${inviteUrl}" style="background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Set Your Password</a>
          </div>
          <p style="font-size: 13px; color: #6b7280;">This invite link expires in 7 days. If you did not expect this invitation, you can ignore this email.</p>
        </div>
      `,
    })

    if (result && typeof result === "object" && "error" in result && result.error) {
      console.error("Resend team invite error:", result.error)
      return { emailSent: false, inviteUrl }
    }

    return { emailSent: true, inviteUrl }
  } catch (error) {
    console.error("Failed to send team invite email:", error)
    return { emailSent: false, inviteUrl }
  }
}

export async function inviteTeamMember(email: string, role: string) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, error: "Please enter a valid email address." }
    }

    const normalizedRole = ALLOWED_TEAM_ROLES.has(role) ? role : null
    if (!normalizedRole) {
      return {
        success: false,
        error: "Invalid role. Allowed roles: Team Member, Agency Admin, Sales Rep, Support Agent, Read Only.",
      }
    }

    const subAgencyId = await getActiveSubAccountId()

    // Check globally so unique-email conflicts across agencies are handled cleanly
    const existing = await db.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, agencyId: true }
    })
    if (existing) {
      return {
        success: false,
        error: existing.agencyId === auth.agencyId
          ? "A team member with this email already exists in this agency."
          : "A user account with this email already exists."
      }
    }

    const user = await db.user.create({
      data: {
        agencyId: auth.agencyId,
        subAgencyId,
        email: cleanEmail,
        role: normalizedRole,
        name: cleanEmail.split("@")[0]
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    })

    const { emailSent, inviteUrl } = await issueTeamInviteTokenAndEmail({
      email: cleanEmail,
      agencyId: auth.agencyId,
      role: normalizedRole,
    })

    revalidatePath("/settings/team")
    return {
      success: true,
      data: { ...user, status: "pending" as const },
      emailSent,
      inviteUrl,
    }
  } catch (error: any) {
    console.error("Failed to invite member:", error)
    return { success: false, error: error.message || "Failed to invite member" }
  }
}

export async function resendTeamInvite(memberId: string) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const member = await db.user.findFirst({
      where: { id: memberId, agencyId: auth.agencyId },
      select: { id: true, email: true, role: true },
    })

    if (!member || !member.email) {
      return { success: false, error: "Team member or email address not found." }
    }

    const { emailSent, inviteUrl } = await issueTeamInviteTokenAndEmail({
      email: member.email,
      agencyId: auth.agencyId,
      role: member.role,
    })

    return { success: true, emailSent, inviteUrl }
  } catch (error: any) {
    console.error("Failed to resend invite:", error)
    return { success: false, error: error.message || "Failed to resend invite" }
  }
}

export async function updateTeamMemberRole(memberId: string, role: string) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const normalizedRole = ALLOWED_TEAM_ROLES.has(role) ? role : null
    if (!normalizedRole) {
      return {
        success: false,
        error: "Invalid role. Allowed roles: Team Member, Agency Admin, Sales Rep, Support Agent, Read Only.",
      }
    }

    if (memberId === auth.userId) {
      return { success: false, error: "You cannot change your own role." }
    }

    const target = await db.user.findFirst({
      where: { id: memberId, agencyId: auth.agencyId },
      select: { id: true, role: true },
    })
    if (!target) {
      return { success: false, error: "Team member not found." }
    }

    if (target.role === "Agency Owner") {
      return { success: false, error: "Cannot modify the Agency Owner role." }
    }

    await db.user.updateMany({
      where: { id: memberId, agencyId: auth.agencyId },
      data: { role: normalizedRole },
    })

    revalidatePath("/settings/team")
    return { success: true, data: { id: memberId, role: normalizedRole } }
  } catch (error: any) {
    console.error("Failed to update team member role:", error)
    return { success: false, error: error.message || "Failed to update role" }
  }
}

export async function removeTeamMember(memberId: string) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    if (memberId === auth.userId) {
      return { success: false, error: "You cannot remove yourself from the workspace." }
    }

    const target = await db.user.findFirst({
      where: { id: memberId, agencyId: auth.agencyId },
      select: { id: true, email: true, role: true },
    })
    if (!target) {
      return { success: false, error: "Team member not found." }
    }

    if (target.role === "Agency Owner") {
      return { success: false, error: "Cannot remove the Agency Owner." }
    }

    if (target.email) {
      await db.verificationToken.deleteMany({
        where: { identifier: target.email.toLowerCase() },
      })
    }

    await db.user.deleteMany({
      where: { id: memberId, agencyId: auth.agencyId },
    })

    revalidatePath("/settings/team")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to remove team member:", error)
    return { success: false, error: error.message || "Failed to remove team member" }
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
      db.contact.findMany({ where: { agencyId, deletedAt: null }, orderBy: { createdAt: "desc" } }),
      db.deal.findMany({ where: { agencyId, deletedAt: null }, orderBy: { createdAt: "desc" } }),
      db.appointment.findMany({ where: { agencyId }, orderBy: { startTime: "desc" } }),
      db.pipeline.findMany({ where: { agencyId }, include: { stages: true } }),
      db.workflow.findMany({ where: { agencyId, deletedAt: null } })
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
