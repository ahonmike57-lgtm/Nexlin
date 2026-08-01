"use server"

import { revalidatePath } from "next/cache"
import { withAgency } from "@/lib/tenant"
import { Resend } from "resend"
import twilio from "twilio"

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy")

export const getReputationData = withAgency(async ({ db }) => {
  const reviews = await db.review.findMany({
    orderBy: { createdAt: "desc" },
  })

  const requests = await db.reviewRequest.findMany({
    include: { contact: true },
    orderBy: { createdAt: "desc" },
  })

  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0

  return {
    reviews,
    requests,
    stats: {
      totalReviews: reviews.length,
      averageRating: averageRating.toFixed(1),
      requestsSent: requests.length,
    }
  }
})

export const sendReviewRequest = withAgency(
  async ({ db, agencyId }, contactId: string, channel: string) => {
    const contact = await db.contact.findFirst({ where: { id: contactId } })
    if (!contact) throw new Error("Contact not found")

    const agency = await db.agency.findFirst({ where: { id: agencyId } })
    const agencyName = agency?.name || "Our Business"

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
      }
    }

    const request = await db.reviewRequest.create({
      data: {
        agencyId,
        contactId,
        channel,
        status: "sent"
      }
    })

    revalidatePath("/reputation")
    return request
  }
)
