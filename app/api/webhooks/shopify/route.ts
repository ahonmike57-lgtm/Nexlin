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

    let contact = await db.contact.findFirst({
      where: { email: cleanEmail }
    })

    if (!contact) {
      const agency = await db.agency.findFirst()
      if (agency) {
        contact = await db.contact.create({
          data: {
            agencyId: agency.id,
            firstName: body.customer?.first_name || "Shopify",
            lastName: body.customer?.last_name || "Customer",
            email: cleanEmail,
            phone: body.customer?.phone || body.phone,
            tags: "shopify_customer",
            leadScore: 50
          }
        })
      }
    }

    if (contact) {
      if (topic === "orders/create" || topic.includes("order")) {
        await db.contact.update({
          where: { id: contact.id },
          data: {
            leadScore: (contact.leadScore || 0) + 20
          }
        })

        // Create deal for order volume
        const pipeline = await db.pipeline.findFirst({
          where: { agencyId: contact.agencyId },
          include: { stages: { orderBy: { order: "asc" } } }
        })

        const stageId = pipeline?.stages?.[pipeline.stages.length - 1]?.id || pipeline?.stages?.[0]?.id

        if (stageId && pipeline) {
          const orderValue = parseFloat(body.total_price || body.current_total_price || "0") || 100
          await db.deal.create({
            data: {
              agencyId: contact.agencyId,
              contactId: contact.id,
              pipelineId: pipeline.id,
              stageId,
              stage: pipeline.stages?.[pipeline.stages.length - 1]?.name || "Won",
              title: `Shopify Order #${body.order_number || body.id}`,
              value: orderValue
            }
          }).catch(() => {})
        }
      }
    }

    return NextResponse.json({ status: "success" })
  } catch (error) {
    console.error("Shopify Webhook Error:", error)
    return NextResponse.json({ error: "Webhook Error" }, { status: 500 })
  }
}
