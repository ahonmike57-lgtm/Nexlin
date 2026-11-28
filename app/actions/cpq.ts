"use server"

import crypto from "crypto"
import { revalidatePath } from "next/cache"
import { withAgency } from "@/lib/tenant"
import { triggerDealStageChangedWorkflowInternal, triggerWorkflowsInternal } from "@/lib/workflow-engine"

export const createCPQQuote = withAgency(
  async ({ db, agencyId }, data: {
    title: string
    contactId: string
    dealId?: string
    currency?: string
    discountPercentage?: number
    items: Array<{ name: string; quantity: number; unitPrice: number }>
  }) => {
    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new Error("At least one line item is required")
    }

    for (const item of data.items) {
      if (typeof item.quantity !== "number" || !Number.isFinite(item.quantity) || item.quantity <= 0) {
        throw new Error("Line item quantity must be greater than 0")
      }
      if (typeof item.unitPrice !== "number" || !Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
        throw new Error("Line item unit price must be zero or greater")
      }
    }

    const discountPct = data.discountPercentage ?? 0
    if (typeof discountPct !== "number" || !Number.isFinite(discountPct) || discountPct < 0 || discountPct > 100) {
      throw new Error("Discount percentage must be between 0 and 100")
    }

    const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const discount = discountPct ? (subtotal * discountPct) / 100 : 0
    const total = Math.max(0, subtotal - discount)

    const requiresApproval = discountPct > 20
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
          discountPercentage: discountPct,
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

    let data: any = {}
    try {
      data = JSON.parse(snapshot.description)
    } catch {
      data = {}
    }
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

    return quotes.map(q => {
      let descData: any = {}
      if (q.description) {
        try {
          descData = JSON.parse(q.description)
        } catch {}
      }
      return {
        id: q.id,
        title: q.name,
        ...descData
      }
    })
  }
)

export const signCPQQuote = withAgency(
  async ({ db, agencyId }, data: {
    quoteId: string
    signatureDataUrl: string
    signerName: string
    signerEmail?: string
  }) => {
    const snapshot = await db.snapshot.findFirst({
      where: { id: data.quoteId, version: "cpq_quote" }
    })

    if (!snapshot || !snapshot.description) throw new Error("Quote not found")

    let quoteData: any = {}
    try {
      quoteData = JSON.parse(snapshot.description)
    } catch {
      quoteData = {}
    }

    if (quoteData.status === "pending_approval") {
      throw new Error("Quote requires admin approval before signing")
    }
    if (quoteData.status === "signed") {
      throw new Error("Quote has already been signed")
    }

    const signedAt = new Date().toISOString()
    const certHex = crypto.randomBytes(4).toString("hex").toUpperCase()
    const certificateId = `CERT-${certHex.slice(0, 4)}-${certHex.slice(4)}`

    quoteData.status = "signed"
    quoteData.signedAt = signedAt
    quoteData.signerName = data.signerName
    quoteData.signerEmail = data.signerEmail || null
    quoteData.signatureDataUrl = data.signatureDataUrl
    quoteData.certificateId = certificateId
    quoteData.auditTrail = {
      certificateId,
      signedAt,
      signerName: data.signerName,
      status: "Verified Legally Binding",
      standard: "ESIGN / UETA Compliant",
    }

    await db.snapshot.updateMany({
      where: { id: data.quoteId },
      data: { description: JSON.stringify(quoteData) }
    })

    let dealUpdated = false
    if (quoteData.dealId) {
      const dealUpdate = await db.deal.updateMany({
        where: { id: quoteData.dealId },
        data: { stage: "won", updatedAt: new Date() }
      })
      if (dealUpdate.count > 0) {
        dealUpdated = true
        await triggerDealStageChangedWorkflowInternal(agencyId, quoteData.dealId, "won", quoteData.contactId).catch(() => {})
        await triggerWorkflowsInternal(agencyId, "quote_signed", {
          quoteId: data.quoteId,
          dealId: quoteData.dealId,
          contactId: quoteData.contactId,
        }).catch(() => {})
      }
    }

    revalidatePath("/crm/invoices")
    revalidatePath("/crm/deals")
    revalidatePath("/dashboard")
    return {
      success: true,
      quoteId: data.quoteId,
      status: "signed",
      certificateId,
      signedAt,
      dealWon: dealUpdated
    }
  }
)
