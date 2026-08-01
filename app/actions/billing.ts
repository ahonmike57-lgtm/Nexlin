"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { withAgency } from "@/lib/tenant"
import Stripe from "stripe"

export const generateCheckoutSession = withAgency(
  async ({ agencyId, userId }, processor: string) => {
    if (processor === "stripe" && process.env.STRIPE_SECRET_KEY) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-06-24.dahlia" })
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: "price_mock_id", quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/billing?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/billing?canceled=true`,
      })
      return { url: checkoutSession.url }
    }

    if (processor === "paystack" && process.env.PAYSTACK_SECRET_KEY) {
      const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "billing@nexlin.site",
          amount: 29900 * 100, // Amount in kobo for NGN
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/billing?success=true`,
        })
      })
      const data = await response.json()
      if (data.status) {
        return { url: data.data.authorization_url }
      }
    }

    // Fallback URL for mock environment
    return { url: `/settings/billing/mock-checkout?processor=${processor}` }
  }
)

export const processMockSubscription = withAgency(
  async ({ db, agencyId }, plan: string) => {
    await db.agency.updateMany({
      where: { id: agencyId },
      data: { planTier: plan, status: "active" }
    })

    revalidatePath("/settings/billing")
    return { agencyId, plan }
  }
)

// Constants for base cost (e.g. Twilio/Mailgun actual cost to agency)
const BASE_COSTS = {
  sms: 0.0079,
  email: 0.0008,
  ai_tokens: 0.02,
  call_minutes: 0.013
}

export const getSaaSConfig = withAgency(
  async ({ db, agencyId }) => {
    const markups = await db.rebillingMarkup.findMany({
      where: { agencyId }
    })

    const wallet = await db.billingWallet.findFirst({
      where: { agencyId }
    })

    const usageLogs = await db.usageLog.findMany({
      where: { wallet: { agencyId } },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return { markups, wallet, usageLogs }
  }
)

export const updateRebillingMarkup = withAgency(
  async ({ db, agencyId }, type: string, multiplier: number) => {
    const markup = await db.rebillingMarkup.upsert({
      where: {
        agencyId_type: {
          agencyId,
          type
        }
      },
      update: {
        multiplier
      },
      create: {
        agencyId,
        type,
        multiplier
      }
    })

    revalidatePath("/settings/billing")
    return markup
  },
  { role: "admin" }
)

export const logUsageAndBill = withAgency(
  async ({ db, agencyId }, subAgencyId: string, type: 'sms' | 'email' | 'ai_tokens' | 'call_minutes', amount: number, description?: string) => {
    const baseCost = BASE_COSTS[type] * amount

    const markupRecord = await db.rebillingMarkup.findFirst({
      where: { agencyId, type }
    })
    const multiplier = markupRecord ? markupRecord.multiplier : 1.0

    const finalCharge = baseCost * multiplier

    let wallet = await db.billingWallet.findFirst({
      where: { subAgencyId }
    })

    if (!wallet) {
      wallet = await db.billingWallet.create({
        data: { subAgencyId, balance: 10.0, agencyId }
      })
    }

    const log = await db.usageLog.create({
      data: {
        walletId: wallet.id,
        type,
        amount,
        cost: baseCost,
        markup: finalCharge,
        description
      }
    })

    const newBalance = wallet.balance - finalCharge
    await db.billingWallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance }
    })

    return { log, newBalance }
  }
)
