"use server"

import { revalidatePath } from "next/cache"
import { withAgency } from "@/lib/tenant"

export const createCPQQuote = withAgency(
  async ({ db, agencyId }, data: {
    title: string
    contactId: string
    dealId?: string
    currency?: string
    discountPercentage?: number
    items: Array<{ name: string; quantity: number; unitPrice: number }>
  }) => {
    const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const discount = data.discountPercentage ? (subtotal * data.discountPercentage) / 100 : 0
    const total = subtotal - discount

    const requiresApproval = (data.discountPercentage || 0) > 20
    const status = requiresApproval ? "pending_approval" : "approved"

    const quote = await db.snapshot.create({
      data: {
        agencyId,
        name: data.title.trim(),
        version: "cpq_quote",
        description: JSON.stringify({
          contactId: data.contactId,
          dealId: data.dealId,
          currency: data.currency || "USD",
          subtotal,
          discountPercentage: data.discountPercentage || 0,
          total,
          status,
          requiresApproval,
          items: data.items,
          createdAt: new Date().toISOString()
        })
      }
    })

    revalidatePath("/crm/invoices")
    return { quote, requiresApproval }
  }
)

export const approveCPQQuote = withAgency(
  async ({ db, userId }, quoteId: string) => {
    const snapshot = await db.snapshot.findFirst({
      where: { id: quoteId, version: "cpq_quote" }
    })

    if (!snapshot || !snapshot.description) throw new Error("Quote not found")

    const data = JSON.parse(snapshot.description)
    data.status = "approved"
    data.approvedBy = userId
    data.approvedAt = new Date().toISOString()

    await db.snapshot.updateMany({
      where: { id: quoteId },
      data: { description: JSON.stringify(data) }
    })

    revalidatePath("/crm/invoices")
    return { id: quoteId, status: "approved" }
  },
  { role: "admin" }
)

export const getCPQQuotes = withAgency(
  async ({ db }) => {
    const quotes = await db.snapshot.findMany({
      where: { version: "cpq_quote" },
      orderBy: { createdAt: "desc" }
    })

    return quotes.map(q => ({
      id: q.id,
      title: q.name,
      ...(q.description ? JSON.parse(q.description) : {})
    }))
  }
)
