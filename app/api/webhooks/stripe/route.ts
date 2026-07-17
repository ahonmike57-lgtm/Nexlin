import { NextResponse } from "next/server"
import Stripe from "stripe"
import { db } from "@/lib/db"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy", {
  apiVersion: "2026-06-24.dahlia",
})

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")

  let event: Stripe.Event

  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error("Missing STRIPE_WEBHOOK_SECRET")
    }
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    console.error(`Stripe Webhook Error: ${err.message}`)
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const agencyId = session.metadata?.agencyId
        if (agencyId) {
          const existing = await db.subscription.findFirst({ where: { agencyId } })
          if (existing) {
            await db.subscription.update({
              where: { id: existing.id },
              data: {
                status: "active",
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: session.subscription as string,
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              }
            })
          } else {
            await db.subscription.create({
              data: {
                agencyId,
                paymentProcessor: "stripe",
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: session.subscription as string,
                status: "active",
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              }
            })
          }
          console.log(`[Stripe] Subscription activated for agency: ${agencyId}`)
        }
        break
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        // In Stripe SDK v22+, use any-cast to access subscription field
        const subscriptionId = (invoice as any).subscription as string | undefined
        if (subscriptionId) {
          const sub = await db.subscription.findFirst({
            where: { stripeSubscriptionId: subscriptionId }
          })
          if (sub) {
            await db.subscription.update({ where: { id: sub.id }, data: { status: "past_due" } })
            console.log(`[Stripe] Subscription past_due for: ${sub.agencyId}`)
          }
        }
        break
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const sub = await db.subscription.findFirst({
          where: { stripeSubscriptionId: subscription.id }
        })
        if (sub) {
          await db.subscription.update({ where: { id: sub.id }, data: { status: "cancelled" } })
          console.log(`[Stripe] Subscription cancelled for: ${sub.agencyId}`)
        }
        break
      }
      default:
        console.log(`[Stripe] Unhandled event type: ${event.type}`)
    }

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.error("[Stripe] Webhook handler error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
