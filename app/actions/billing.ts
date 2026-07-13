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
