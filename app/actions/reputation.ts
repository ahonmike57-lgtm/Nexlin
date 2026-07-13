"use server"

import { revalidatePath } from "next/cache"
import { db as prisma } from "@/lib/db"

export async function getReputationData(agencyId: string) {
  try {
    const reviews = await prisma.review.findMany({
      where: { agencyId },
      orderBy: { createdAt: "desc" },
    })

    const requests = await prisma.reviewRequest.findMany({
      where: { agencyId },
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
    return { success: false, error: error.message }
  }
}
