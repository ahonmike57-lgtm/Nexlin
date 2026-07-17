"use server"

import { db as prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import crypto from "crypto"

export async function getAffiliates(agencyId: string) {
  try {
    const affiliates = await prisma.affiliate.findMany({
      where: { agencyId },
      include: {
        links: true,
        payouts: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return { success: true, data: affiliates }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createAffiliate(agencyId: string, name: string, email: string, targetUrl: string) {
  try {
    // 1. Create the affiliate
    const affiliate = await prisma.affiliate.create({
      data: {
        agencyId,
        name,
        email,
      }
    })

    // 2. Generate a unique code
    const code = crypto.randomBytes(4).toString("hex")

    // 3. Create their first affiliate link
    await prisma.affiliateLink.create({
      data: {
        affiliateId: affiliate.id,
        code,
        targetUrl
      }
    })

    revalidatePath("/affiliates")
    return { success: true, data: affiliate }
  } catch (error: any) {
    console.error("Error creating affiliate:", error)
    return { success: false, error: error.message }
  }
}

// Logic to record a click (would be called from a middleware or page component)
export async function trackAffiliateClick(code: string) {
  try {
    await prisma.affiliateLink.update({
      where: { code },
      data: { clicks: { increment: 1 } }
    })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Logic to record a conversion/sale
export async function trackAffiliateConversion(code: string, saleAmount: number) {
  try {
    const link = await prisma.affiliateLink.update({
      where: { code },
      data: { conversions: { increment: 1 } },
      include: { affiliate: true }
    })

    // 30% default commission for example
    const commission = saleAmount * 0.30

    await prisma.commissionPayout.create({
      data: {
        affiliateId: link.affiliateId,
        amount: commission,
        status: "pending",
        description: `Commission for sale of $${saleAmount}`
      }
    })

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
