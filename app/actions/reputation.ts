"use server"

import { revalidatePath } from "next/cache"
import { db as rawDb } from "@/lib/db"
import { deliverMessage } from "@/lib/messaging"
import { checkRateLimit } from "@/lib/rate-limit"
import { withAgency } from "@/lib/tenant"
import { triggerReviewReceivedWorkflowInternal } from "@/lib/workflow-engine"

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
    },
  }
})

export const sendReviewRequest = withAgency(
  async ({ db, agencyId }, contactId: string, channel: string) => {
    const contact = await db.contact.findFirst({ where: { id: contactId } })
    if (!contact) throw new Error("Contact not found")

    const normalizedChannel = channel === "sms" ? "sms" : "email"

    if (normalizedChannel === "email") {
      if (!contact.email) {
        throw new Error("Contact does not have an email address")
      }
      if (contact.emailSuppressed) {
        throw new Error("Contact email is suppressed")
      }
    } else {
      if (!contact.phone) {
        throw new Error("Contact does not have a phone number")
      }
      if (contact.dndEnabled) {
        throw new Error("Contact has DND enabled for SMS")
      }
    }

    const agency = await db.agency.findFirst({
      where: { id: agencyId },
      select: { name: true, whiteLabelName: true },
    })
    const agencyName = agency?.whiteLabelName || agency?.name || "Our Business"

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://nexlin-virid.vercel.app").replace(/\/+$/, "")
    const reviewLink = `${baseUrl}/review/${agencyId}`
    const contactName = `${contact.firstName} ${contact.lastName || ""}`.trim() || "there"

    const delivery = await deliverMessage({
      agencyId,
      channel: normalizedChannel,
      contact,
      subject: normalizedChannel === "email" ? `How was your experience with ${agencyName}?` : undefined,
      content: `Hi ${contactName}! How was your experience with ${agencyName}? Leave us a quick review: ${reviewLink}`,
    })

    if (!delivery.ok) {
      throw new Error(delivery.error || `Failed to send ${normalizedChannel} review request`)
    }

    const request = await db.reviewRequest.create({
      data: {
        agencyId,
        contactId: contact.id,
        channel: normalizedChannel,
        status: "sent",
      },
    })

    revalidatePath("/reputation")
    return request
  }
)

export async function getPublicAgencyForReview(agencyId: string) {
  try {
    if (!agencyId) return null
    const agency = await rawDb.agency.findUnique({
      where: { id: agencyId },
      select: {
        id: true,
        name: true,
        whiteLabelName: true,
        logoUrl: true,
      },
    })
    if (!agency) return null
    return {
      id: agency.id,
      name: agency.whiteLabelName || agency.name,
      logoUrl: agency.logoUrl,
    }
  } catch {
    return null
  }
}

export async function submitPublicReview(
  agencyId: string,
  data: {
    authorName: string
    rating: number
    comment?: string
    email?: string
  }
) {
  try {
    const rl = checkRateLimit(`review:${agencyId}`, {
      maxRequests: 15,
      windowSeconds: 300,
    })
    if (!rl.allowed) {
      return { success: false, error: "Too many submissions. Please try again later." }
    }

    const agency = await rawDb.agency.findUnique({
      where: { id: agencyId },
      select: { id: true },
    })
    if (!agency) {
      return { success: false, error: "Business not found" }
    }

    const authorName = (data.authorName || "").trim()
    if (!authorName) {
      return { success: false, error: "Please enter your name" }
    }

    const rating = Math.round(Number(data.rating))
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return { success: false, error: "Rating must be between 1 and 5 stars" }
    }

    const cleanEmail = typeof data.email === "string" && data.email.trim()
      ? data.email.trim().toLowerCase()
      : null

    let contact = null
    if (cleanEmail) {
      contact = await rawDb.contact.findFirst({
        where: { agencyId, email: cleanEmail, deletedAt: null },
        select: { id: true },
      })
    }

    const review = await rawDb.review.create({
      data: {
        agencyId,
        contactId: contact?.id || null,
        platform: "direct",
        rating,
        authorName: authorName.slice(0, 120),
        content: (data.comment || "").trim().slice(0, 2000) || null,
      },
    })

    await triggerReviewReceivedWorkflowInternal(agencyId, rating, contact?.id).catch(() => {})
    revalidatePath("/reputation")

    return { success: true, reviewId: review.id }
  } catch (error: any) {
    console.error("Submit public review error:", error)
    return { success: false, error: "Failed to submit review" }
  }
}
