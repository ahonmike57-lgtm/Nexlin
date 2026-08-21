"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"
import { Resend } from "resend"
import { sendSMS } from "./telephony"

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy")

export async function getCampaigns(agencyId: string) {
  try {
    const campaigns = await db.campaign.findMany({
      where: { agencyId },
      orderBy: { createdAt: "desc" }
    })
    return { success: true, data: campaigns }
  } catch (error) {
    console.error("Failed to fetch campaigns:", error)
    return { success: false, error: "Failed to fetch campaigns" }
  }
}

export async function createCampaign(agencyId: string, name: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const campaign = await db.campaign.create({
      data: {
        agencyId,
        name,
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
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
      include: { agency: true }
    })

    if (!campaign) throw new Error("Campaign not found")

    // Set status to sending
    await db.campaign.update({ where: { id: campaignId }, data: { status: "sending" } })

    if (!process.env.RESEND_API_KEY) {
      console.warn("No RESEND_API_KEY, marking as mock sent.")
      await db.campaign.update({ where: { id: campaignId }, data: { status: "completed", sentAt: new Date() } })
      revalidatePath("/marketing/emails")
      return { success: true, mock: true }
    }

    // Fetch all contacts with valid emails
    const contacts = await db.contact.findMany({
      where: { agencyId: campaign.agencyId, email: { not: null } },
      select: { id: true, email: true, firstName: true }
    })

    if (contacts.length === 0) {
      await db.campaign.update({ where: { id: campaignId }, data: { status: "completed", sentAt: new Date() } })
      revalidatePath("/marketing/emails")
      return { success: true, count: 0 }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nexlin.vercel.app"

    // Send in batches of 50 (Resend batch limit) with 1x1 open tracking pixel
    const BATCH_SIZE = 50
    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
      const batch = contacts.slice(i, i + BATCH_SIZE)
      await resend.batch.send(
        batch.map((contact) => ({
          from: `${campaign.agency.name} <onboarding@resend.dev>`,
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
    }

    await db.campaign.update({ where: { id: campaignId }, data: { status: "completed", sentAt: new Date() } })
    revalidatePath("/marketing/emails")
    return { success: true, count: contacts.length }
  } catch (error: any) {
    console.error("Failed to send campaign:", error)
    await db.campaign.update({ where: { id: campaignId }, data: { status: "draft" } }).catch(() => {})
    return { success: false, error: error?.message || "Failed to send campaign" }
  }
}

export async function updateCampaign(campaignId: string, data: { name?: string; subject?: string; content?: string; status?: string }) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const campaign = await db.campaign.update({
      where: { id: campaignId },
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

export async function sendSmsBroadcast(agencyId: string, message: string, tagFilter?: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    if (!message?.trim()) return { success: false, error: "Message cannot be empty" }

    // Fetch contacts with phone numbers, optionally filtered by tag
    const whereClause: any = {
      agencyId,
      phone: { not: null },
    }
    if (tagFilter) {
      whereClause.tags = { has: tagFilter }
    }

    const contacts = await db.contact.findMany({
      where: whereClause,
      select: { id: true, firstName: true, phone: true }
    })

    if (contacts.length === 0) {
      return { success: false, error: "No contacts with phone numbers found" }
    }

    let sent = 0
    let failed = 0
    for (const contact of contacts) {
      if (!contact.phone) continue
      const res = await sendSMS(contact.id, message)
      if (res.success) sent++
      else failed++
    }

    return { success: true, sent, failed, total: contacts.length }
  } catch (error: any) {
    console.error("SMS Broadcast error:", error)
    return { success: false, error: error?.message || "Failed to send SMS broadcast" }
  }
}
