"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { requireTenantAuth } from "@/lib/permissions"
import { loadChannelCredentials } from "@/lib/messaging"
import { interpolateMergeTags } from "@/lib/merge-tags"
import { Resend } from "resend"
import { sendSMS } from "./telephony"

export async function getCampaigns(_agencyId?: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const campaigns = await db.campaign.findMany({
      where: { agencyId: auth.agencyId },
      orderBy: { createdAt: "desc" }
    })
    return { success: true, data: campaigns }
  } catch (error) {
    console.error("Failed to fetch campaigns:", error)
    return { success: false, error: "Failed to fetch campaigns" }
  }
}

export async function createCampaign(_agencyId: string, name: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const campaign = await db.campaign.create({
      data: {
        agencyId: auth.agencyId,
        name: name?.trim() || "Untitled Campaign",
        subject: "New Campaign Subject",
        content: "{}",
        status: "draft"
      }
    })

    revalidatePath("/marketing/emails")
    return { success: true, data: campaign }
  } catch (error) {
    console.error("Failed to create campaign:", error)
    return { success: false, error: "Failed to create campaign" }
  }
}

export async function sendCampaign(campaignId: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const campaign = await db.campaign.findFirst({
      where: { id: campaignId, agencyId: auth.agencyId },
      include: { agency: true }
    })

    if (!campaign) {
      return { success: false, error: "Campaign not found" }
    }

    const resendKey = process.env.RESEND_API_KEY?.trim()
    if (!resendKey) {
      return { success: false, error: "Email delivery is not configured (RESEND_API_KEY missing)." }
    }

    // Set status to sending
    await db.campaign.update({ where: { id: campaign.id }, data: { status: "sending" } })

    // Fetch all unsuppressed, non-deleted contacts with valid emails
    const contacts = await db.contact.findMany({
      where: { agencyId: campaign.agencyId, email: { not: null }, emailSuppressed: false, deletedAt: null },
      select: { id: true, email: true, firstName: true, lastName: true }
    })

    if (contacts.length === 0) {
      await db.campaign.update({ where: { id: campaign.id }, data: { status: "draft" } })
      return { success: false, error: "No unsuppressed contacts with email addresses found." }
    }

    const creds = await loadChannelCredentials(campaign.agencyId)
    const senderRaw = creds.emailAddress || process.env.RESEND_FROM_EMAIL
    const fromHeader = senderRaw
      ? (senderRaw.includes("<") ? senderRaw : `${campaign.agency.name} <${senderRaw}>`)
      : `${campaign.agency.name} <onboarding@resend.dev>`

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nexlin.vercel.app"
    const resend = new Resend(resendKey)

    // Send in batches of 50 (Resend batch limit) with 1x1 open tracking pixel
    const BATCH_SIZE = 50
    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
      const batch = contacts.slice(i, i + BATCH_SIZE)
      const { error } = await resend.batch.send(
        batch.map((contact) => ({
          from: fromHeader,
          to: [contact.email!],
          subject: campaign.subject,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <p>Hi ${contact.firstName},</p>
              <div>${campaign.content}</div>
              <img src="${appUrl}/api/t/open/${campaignId}_${contact.id}" width="1" height="1" style="display:none;" alt="" />
            </div>
          `,
        }))
      )
      if (error) {
        throw new Error(error.message || "Resend batch send failed")
      }
    }

    await db.campaign.update({ where: { id: campaign.id }, data: { status: "completed", sentAt: new Date() } })
    revalidatePath("/marketing/emails")
    return { success: true, count: contacts.length }
  } catch (error: any) {
    console.error("Failed to send campaign:", error)
    await db.campaign.updateMany({
      where: { id: campaignId, agencyId: auth.agencyId },
      data: { status: "draft" }
    }).catch(() => {})
    return { success: false, error: error?.message || "Failed to send campaign" }
  }
}

export async function updateCampaign(campaignId: string, data: { name?: string; subject?: string; content?: string; status?: string }) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const existing = await db.campaign.findFirst({
      where: { id: campaignId, agencyId: auth.agencyId },
      select: { id: true }
    })

    if (!existing) {
      return { success: false, error: "Campaign not found" }
    }

    const campaign = await db.campaign.update({
      where: { id: existing.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.subject !== undefined && { subject: data.subject }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.status !== undefined && { status: data.status }),
      }
    })

    revalidatePath("/marketing/emails")
    return { success: true, data: campaign }
  } catch (error: any) {
    console.error("Failed to update campaign:", error)
    return { success: false, error: error?.message || "Failed to update campaign" }
  }
}

export async function sendSmsBroadcast(_agencyId: string, message: string, tagFilter?: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    if (!message?.trim()) return { success: false, error: "Message cannot be empty" }

    const agency = await db.agency.findUnique({
      where: { id: auth.agencyId },
      select: { id: true, name: true }
    })

    // Fetch non-DND, non-deleted contacts with phone numbers in caller's agency
    const whereClause: any = {
      agencyId: auth.agencyId,
      phone: { not: null },
      dndEnabled: false,
      deletedAt: null,
    }
    if (tagFilter?.trim()) {
      whereClause.tags = { contains: tagFilter.trim(), mode: "insensitive" }
    }

    const contacts = await db.contact.findMany({
      where: whereClause,
      select: { id: true, firstName: true, lastName: true, phone: true, email: true }
    })

    if (contacts.length === 0) {
      return { success: false, error: "No contacts with phone numbers found" }
    }

    let sent = 0
    let failed = 0
    for (const contact of contacts) {
      if (!contact.phone) continue
      const normalizedTemplate = message
        .replace(/\{\{\s*first_name\s*\}\}/gi, contact.firstName || "there")
        .replace(/\{\{\s*last_name\s*\}\}/gi, contact.lastName || "")
      const personalized = interpolateMergeTags(normalizedTemplate, {
        contact,
        agency: agency || undefined,
      })
      const res = await sendSMS(contact.id, personalized)
      if (res.success) sent++
      else failed++
    }

    return { success: true, sent, failed, total: contacts.length }
  } catch (error: any) {
    console.error("SMS Broadcast error:", error)
    return { success: false, error: error?.message || "Failed to send SMS broadcast" }
  }
}
