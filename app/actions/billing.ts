"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"

import Stripe from "stripe"

export async function generateCheckoutSession(agencyId: string, processor: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    if (processor === "stripe" && process.env.STRIPE_SECRET_KEY) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-06-24.dahlia" })
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: "price_mock_id", quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/billing?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/billing?canceled=true`,
      })
      return { success: true, url: checkoutSession.url }
    }

    if (processor === "paystack" && process.env.PAYSTACK_SECRET_KEY) {
      const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session.user.email || "test@example.com",
          amount: 29900 * 100, // Amount in kobo for NGN or pesewas for GHS
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/billing?success=true`,
        })
      })
      const data = await response.json()
      if (data.status) {
        return { success: true, url: data.data.authorization_url }
      }
    }

    // Fallback to mock for testing without keys
    return { 
      success: true, 
      url: `/settings/billing/mock-checkout?processor=${processor}` 
    }
  } catch (error) {
    console.error(`Failed to create ${processor} checkout session:`, error)
    return { success: false, error: "Failed to initialize checkout" }
  }
}

export async function processMockSubscription(agencyId: string, plan: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // Update the agency to mock an active subscription
    // Assuming agency exists and can be updated. For this mock we'll just return success.
    // In real app:
    // await db.agency.update({ where: { id: agencyId }, data: { plan: plan } })

    revalidatePath("/settings/billing")
    return { success: true }
  } catch (error) {
    console.error("Failed to process mock subscription:", error)
    return { success: false, error: "Failed to process subscription" }
  }
}

// Constants for base cost (e.g. Twilio/Mailgun actual cost to agency)
const BASE_COSTS = {
  sms: 0.0079,     // Twilio SMS base cost
  email: 0.0008,   // Mailgun email base cost
  ai_tokens: 0.02, // OpenAI 1K tokens base cost
  call_minutes: 0.013 // Twilio voice base cost
}

export async function getSaaSConfig(agencyId: string) {
  try {
    const markups = await db.rebillingMarkup.findMany({
      where: { agencyId }
    })
    
    const wallet = await db.billingWallet.findUnique({
      where: { agencyId }
    })
    
    // Get usage across all sub-accounts under this agency
    const usageLogs = await db.usageLog.findMany({
      where: { 
        wallet: { agencyId } 
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return { success: true, data: { markups, wallet, usageLogs } }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateRebillingMarkup(agencyId: string, type: string, multiplier: number) {
  try {
    const { checkPermission } = await import("@/lib/permissions")
    const isAllowed = await checkPermission(agencyId, "Agency Admin")
    if (!isAllowed) {
      return { success: false, error: "Insufficient permissions to update billing settings" }
    }

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
    return { success: true, data: markup }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Function to log usage and deduct from a sub-account's wallet based on Agency markup
export async function logUsageAndBill(subAgencyId: string, agencyId: string, type: 'sms' | 'email' | 'ai_tokens' | 'call_minutes', amount: number, description?: string) {
  try {
    // 1. Get the base cost
    const baseCost = BASE_COSTS[type] * amount
    
    // 2. Get the agency's markup multiplier for this type
    const markupRecord = await db.rebillingMarkup.findUnique({
      where: { agencyId_type: { agencyId, type } }
    })
    const multiplier = markupRecord ? markupRecord.multiplier : 1.0 // default 1x
    
    // 3. Calculate final charge to the sub-account
    const finalCharge = baseCost * multiplier
    
    // 4. Find or create the sub-account wallet
    let wallet = await db.billingWallet.findUnique({
      where: { subAgencyId }
    })
    
    if (!wallet) {
      wallet = await db.billingWallet.create({
        data: { subAgencyId, balance: 10.0 } // give $10 starting credit for demo
      })
    }
    
    // 5. Create usage log
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
    
    // 6. Deduct balance from wallet
    await db.billingWallet.update({
      where: { id: wallet.id },
      data: { balance: wallet.balance - finalCharge }
    })
    
    return { success: true, data: { log, newBalance: wallet.balance - finalCharge } }
  } catch (error: any) {
    console.error("Usage billing error:", error)
    return { success: false, error: error.message }
  }
}
