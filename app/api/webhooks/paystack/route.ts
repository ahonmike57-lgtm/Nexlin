import { NextResponse } from "next/server"
import crypto from "crypto"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get("x-paystack-signature")

  if (!process.env.PAYSTACK_SECRET_KEY) {
    return new NextResponse("Missing PAYSTACK_SECRET_KEY", { status: 400 })
  }

  // Verify Paystack Signature
  const hash = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(body).digest("hex")
  if (hash !== sig) {
    return new NextResponse("Invalid Signature", { status: 401 })
  }

  const event = JSON.parse(body)

  try {
    switch (event.event) {
      case "charge.success": {
        const data = event.data
        const agencyId = data.metadata?.agencyId
        if (agencyId) {
          const existing = await db.subscription.findFirst({ where: { agencyId } })
          if (existing) {
            await db.subscription.update({
              where: { id: existing.id },
              data: {
                status: "active",
                paystackCode: data.reference,
                paystackEmail: data.customer?.email,
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              }
            })
          } else {
            await db.subscription.create({
              data: {
                agencyId,
                paymentProcessor: "paystack",
                paystackCode: data.reference,
                paystackEmail: data.customer?.email,
                status: "active",
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              }
            })
          }
          console.log(`[Paystack] Subscription activated for agency: ${agencyId}`)
        }
        break
      }
      case "subscription.disable": {
        const sub = await db.subscription.findFirst({
          where: { paystackCode: event.data.subscription_code }
        })
        if (sub) {
          await db.subscription.update({ where: { id: sub.id }, data: { status: "cancelled" } })
          console.log(`[Paystack] Subscription cancelled for: ${sub.agencyId}`)
        }
        break
      }
      default:
        console.log(`[Paystack] Unhandled event type: ${event.event}`)
    }

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.error("[Paystack] Webhook handler error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
