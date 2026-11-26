"use server"

import { db as prisma } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { revalidatePath } from "next/cache"
import crypto from "crypto"

export async function getAffiliates(_agencyId?: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const affiliates = await prisma.affiliate.findMany({
      where: { agencyId: auth.agencyId },
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

export async function createAffiliate(_agencyId: string, name: string, email: string, targetUrl: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const parsedUrl = new URL(targetUrl.trim())
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return { success: false, error: "Target URL must use http:// or https://" }
    }

    // 1. Create the affiliate strictly in caller's agency
    const affiliate = await prisma.affiliate.create({
      data: {
        agencyId: auth.agencyId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
      }
    })

    // 2. Generate a unique code
    const code = crypto.randomBytes(4).toString("hex")

    // 3. Create their first affiliate link
    await prisma.affiliateLink.create({
      data: {
        affiliateId: affiliate.id,
        code,
        targetUrl: parsedUrl.toString()
      }
    })

    revalidatePath("/affiliates")
    return { success: true, data: affiliate }
  } catch (error: any) {
    console.error("Error creating affiliate:", error)
    return { success: false, error: error.message }
  }
}

// Logic to record a click (public referral redirect endpoint)
export async function trackAffiliateClick(code: string) {
  const cleanCode = code?.trim()
  if (!cleanCode) {
    return { success: false, error: "Invalid referral code" }
  }

  try {
    await prisma.affiliateLink.update({
      where: { code: cleanCode },
      data: { clicks: { increment: 1 } }
    })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Logic to record a conversion/sale (tenant admin only)
export async function trackAffiliateConversion(code: string, saleAmount: number) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  const cleanCode = code?.trim()
  if (!cleanCode || !Number.isFinite(saleAmount) || saleAmount <= 0) {
    return { success: false, error: "Invalid referral code or sale amount" }
  }

  try {
    const existingLink = await prisma.affiliateLink.findUnique({
      where: { code: cleanCode },
      include: { affiliate: true }
    })

    if (!existingLink || existingLink.affiliate.agencyId !== auth.agencyId) {
      return { success: false, error: "Affiliate link not found" }
    }

    await prisma.affiliateLink.update({
      where: { id: existingLink.id },
      data: { conversions: { increment: 1 } }
    })

    // 30% default commission for example
    const commission = saleAmount * 0.30

    await prisma.commissionPayout.create({
      data: {
        affiliateId: existingLink.affiliateId,
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
