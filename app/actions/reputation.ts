"use server"

import { revalidatePath } from "next/cache"
import { db as prisma } from "@/lib/db"
import { Resend } from "resend"
import twilio from "twilio"

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy")

export async function getReputationData(agencyId: string) {
  try {
    const reviews = await prisma.review.findMany({
      where: { agencyId },
      orderBy: { createdAt: "desc" },
    })

    const requests = await prisma.reviewRequest.findMany({
      where: { agencyId },
      include: { contact: true },
      orderBy: { createdAt: "desc" },
    })

    const averageRating = reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 0

    return {
      success: true,
      reviews,
      requests,
      stats: {
        totalReviews: reviews.length,
        averageRating: averageRating.toFixed(1),
        requestsSent: requests.length,
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function sendReviewRequest(agencyId: string, contactId: string, channel: string) {
  try {
    const contact = await prisma.contact.findUnique({ where: { id: contactId } })
    if (!contact) throw new Error("Contact not found")

    const agency = await prisma.agency.findUnique({ where: { id: agencyId } })
    const agencyName = agency?.name || "Our Business"

    // Build a review link (in production this would be a real Google/Yelp link)
    const reviewLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://nexlin.vercel.app"}/review/${agencyId}`
    const contactName = `${contact.firstName} ${contact.lastName || ""}`.trim()

    if (channel === "email" && contact.email) {
      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: `${agencyName} <onboarding@resend.dev>`,
          to: [contact.email],
          subject: `How was your experience with ${agencyName}?`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a1a1a;">Hi ${contactName}! 👋</h2>
              <p style="color: #555;">Thank you for choosing <strong>${agencyName}</strong>. We'd love to hear about your experience!</p>
              <p style="color: #555;">It only takes 30 seconds and means the world to our team.</p>
              <a href="${reviewLink}" style="display: inline-block; background: #1A3CFF; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
                Leave a Review ⭐
              </a>
              <p style="color: #aaa; font-size: 12px; margin-top: 32px;">You received this because you recently worked with ${agencyName}.</p>
            </div>
          `
        })
      } else {
        console.warn("[Reputation] No RESEND_API_KEY — review request email skipped (mock mode)")
      }
    }

    if (channel === "sms" && contact.phone) {
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
        await client.messages.create({
          body: `Hi ${contactName}! How was your experience with ${agencyName}? Leave us a quick review: ${reviewLink}`,
          from: process.env.TWILIO_PHONE_NUMBER || "",
          to: contact.phone,
        })
      } else {
        console.warn("[Reputation] No Twilio credentials — review request SMS skipped (mock mode)")
      }
    }

    const request = await prisma.reviewRequest.create({
      data: {
        agencyId,
        contactId,
        channel,
        status: "sent"
      }
    })

    revalidatePath("/reputation")
    return { success: true, request }
  } catch (error: any) {
    console.error("[Reputation] sendReviewRequest failed:", error)
    return { success: false, error: error.message }
  }
}
