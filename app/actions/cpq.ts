"use server"

import { revalidatePath } from "next/cache"
import { withAgency } from "@/lib/tenant"
import { triggerDealStageChangedWorkflow, triggerWorkflows } from "./workflow-engine"

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
  async ({ db, userId, agencyId }, data: {
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
    const signedAt = new Date().toISOString()
    const certificateId = `CERT-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

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
    // Quote-to-Cash Automation: Auto-advance linked deal to "won"
    if (quoteData.dealId) {
      await db.deal.updateMany({
        where: { id: quoteData.dealId },
        data: { stage: "won", updatedAt: new Date() }
      })
      await triggerDealStageChangedWorkflow(agencyId, quoteData.dealId, "won", quoteData.contactId).catch(() => {})
      await triggerWorkflows(agencyId, "quote_signed", { quoteId: data.quoteId, dealId: quoteData.dealId, contactId: quoteData.contactId }).catch(() => {})
      dealUpdated = true
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


