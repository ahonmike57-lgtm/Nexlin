import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const topic = request.headers.get("x-shopify-topic") || "orders/create"
    const body = await request.json()

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
