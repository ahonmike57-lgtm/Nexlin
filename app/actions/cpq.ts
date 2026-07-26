"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function createCPQQuote(data: {
  title: string
  contactId: string
  dealId?: string
  currency?: string
  discountPercentage?: number
  items: Array<{ name: string; quantity: number; unitPrice: number }>
}) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const discount = data.discountPercentage ? (subtotal * data.discountPercentage) / 100 : 0
    const total = subtotal - discount

    // Quotes requiring > 20% discount flag for manager approval
    const requiresApproval = (data.discountPercentage || 0) > 20
    const status = requiresApproval ? "pending_approval" : "approved"

    const quote = await db.snapshot.create({
      data: {
        agencyId: auth.agencyId,
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

    revalidatePath("/crm/quotes")
    return { success: true, quote, requiresApproval }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function approveCPQQuote(quoteId: string) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const snapshot = await db.snapshot.findFirst({
      where: { id: quoteId, agencyId: auth.agencyId, version: "cpq_quote" }
    })

    if (!snapshot || !snapshot.description) return { success: false, error: "Quote not found" }

    const data = JSON.parse(snapshot.description)
    data.status = "approved"
    data.approvedBy = auth.userId
    data.approvedAt = new Date().toISOString()

    await db.snapshot.update({
      where: { id: quoteId },
      data: { description: JSON.stringify(data) }
    })

    revalidatePath("/crm/quotes")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getCPQQuotes() {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const quotes = await db.snapshot.findMany({
      where: { agencyId: auth.agencyId, version: "cpq_quote" },
      orderBy: { createdAt: "desc" }
    })

    return {
      success: true,
      quotes: quotes.map(q => ({ id: q.id, title: q.name, ...(q.description ? JSON.parse(q.description) : {}) }))
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
