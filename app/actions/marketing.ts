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

    if (!process.env.RESEND_API_KEY) {
      console.warn("No RESEND_API_KEY found, marking as mock sent.")
      await db.campaign.update({
        where: { id: campaignId },
        data: { status: "completed", sentAt: new Date() }
      })
      revalidatePath("/marketing/emails")
      return { success: true, mock: true }
    }

    // In a real app, you would fetch all contacts for this agency 
    // and send in batches. For demo, we just send a single email.
    
    await resend.emails.send({
      from: `${campaign.agency.name} <onboarding@resend.dev>`,
      to: [session.user.email || "test@example.com"],
      subject: campaign.subject,
      html: `<p>${campaign.content}</p>`
    })

    await db.campaign.update({
      where: { id: campaignId },
      data: { status: "completed", sentAt: new Date() }
    })

    revalidatePath("/marketing/emails")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to send campaign:", error)
    return { success: false, error: error?.message || "Failed to send campaign" }
  }
}
