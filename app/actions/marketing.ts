"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"
import { Resend } from "resend"

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
      select: { email: true, firstName: true }
    })

    if (contacts.length === 0) {
      await db.campaign.update({ where: { id: campaignId }, data: { status: "completed", sentAt: new Date() } })
      revalidatePath("/marketing/emails")
      return { success: true, count: 0 }
    }

    // Send in batches of 50 (Resend batch limit)
    const BATCH_SIZE = 50
    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
      const batch = contacts.slice(i, i + BATCH_SIZE)
      await resend.batch.send(
        batch.map((contact) => ({
          from: `${campaign.agency.name} <onboarding@resend.dev>`,
          to: [contact.email!],
          subject: campaign.subject,
          html: `<p>Hi ${contact.firstName},</p><p>${campaign.content}</p>`,
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
