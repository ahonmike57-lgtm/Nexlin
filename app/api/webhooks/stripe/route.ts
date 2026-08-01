import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logWebhookDelivery } from "@/lib/webhooks"
import Stripe from "stripe"

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripeSecretKey) {
    return NextResponse.json({ error: "Stripe credentials not configured" }, { status: 500 })
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2026-06-24.dahlia" })
  const bodyText = await req.text()
  const signature = req.headers.get("stripe-signature")

  let event: Stripe.Event

  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(bodyText, signature, webhookSecret)
    } else {
      // In development mode without webhook secret, parse payload directly
      event = JSON.parse(bodyText) as Stripe.Event
    }
  } catch (err: any) {
    console.error("Stripe Webhook Signature Verification Error:", err.message)
    await logWebhookDelivery({
      webhookId: "system-stripe-webhook",
      event: "stripe.webhook.rejected",
      payload: { reason: err.message },
      statusCode: 400,
      error: err.message
    })
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const agency = await db.agency.findFirst({
          where: { stripeCustomerId: customerId }
        })

        if (agency) {
          const status = subscription.status === "active" ? "active" :
                        subscription.status === "trialing" ? "trialing" :
                        subscription.status === "past_due" ? "past_due" : "suspended"

          await db.agency.update({
            where: { id: agency.id },
            data: { status }
          })
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const agency = await db.agency.findFirst({
          where: { stripeCustomerId: customerId }
        })

        if (agency) {
          await db.agency.update({
            where: { id: agency.id },
            data: { status: "churned" }
          })
        }
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const agency = await db.agency.findFirst({
          where: { stripeCustomerId: customerId }
        })

        if (agency) {
          await db.agency.update({
            where: { id: agency.id },
            data: { status: "active" }
          })
        }
        break
      }
    }

    await logWebhookDelivery({
      webhookId: "system-stripe-webhook",
      event: event.type,
      payload: { id: event.id, type: event.type },
      statusCode: 200
    })

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error("Stripe Webhook Processing Error:", error)
    await logWebhookDelivery({
      webhookId: "system-stripe-webhook",
      event: event.type || "stripe.error",
      payload: bodyText,
      statusCode: 500,
      error: error.message
    })
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
