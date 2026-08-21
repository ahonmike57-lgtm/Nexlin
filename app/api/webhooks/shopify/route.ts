import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyShopifySignature } from "@/lib/webhooks"

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const hmac = request.headers.get("x-shopify-hmac-sha256")
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET

    if (secret && !verifyShopifySignature(rawBody, hmac, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const topic = request.headers.get("x-shopify-topic") || "orders/create"
    const body = JSON.parse(rawBody)

    const email = body.email || body.customer?.email
    if (!email) {
      return NextResponse.json({ status: "ignored" })
    }

    const cleanEmail = email.trim().toLowerCase()

    const contact = await db.contact.findFirst({
      where: { email: cleanEmail }
    })

    if (contact) {
      if (topic === "orders/create") {
        await db.contact.update({
          where: { id: contact.id },
          data: {
            leadScore: (contact.leadScore || 0) + 20
          }
        })
      }
    }

    return NextResponse.json({ status: "success" })
  } catch (error) {
    console.error("Shopify Webhook Error:", error)
    return NextResponse.json({ error: "Webhook Error" }, { status: 500 })
  }
}
