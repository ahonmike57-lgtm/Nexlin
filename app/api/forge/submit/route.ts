import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"
import { triggerWorkflowsInternal } from "@/lib/workflow-engine"

export async function POST(request: Request) {
  // IP / Header Rate Limiting (60 requests per minute per IP)
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown-ip"
  const rateLimit = checkRateLimit(`forge-submit:${clientIp}`, { maxRequests: 60, windowSeconds: 60 })

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.resetInSeconds) }
      }
    )
  }

  try {
    const body = await request.json()
    const { funnelId, siteId, fullName, email, phone, monthlyIncome, formName } = body

    if (!email && !phone) {
      return NextResponse.json({ error: "Email or Phone is required" }, { status: 400 })
    }

    // Resolve agency strictly from siteId or funnelId (no cross-tenant fallback)
    let agencyId = ""
    let validFunnelId: string | null = null

    if (typeof siteId === "string" && siteId.trim()) {
      const site = await db.forgeSite.findUnique({
        where: { id: siteId.trim() },
        select: { id: true, agencyId: true }
      })
      if (site) agencyId = site.agencyId
    }

    if (typeof funnelId === "string" && funnelId.trim()) {
      const funnel = await db.forgeFunnel.findUnique({
        where: { id: funnelId.trim() },
        include: { site: { select: { agencyId: true } } }
      })
      if (funnel?.site?.agencyId) {
        if (!agencyId) {
          agencyId = funnel.site.agencyId
        }
        if (funnel.site.agencyId === agencyId) {
          validFunnelId = funnel.id
        }
      }
    }

    if (!agencyId) {
      return NextResponse.json({ error: "Site or funnel not found" }, { status: 404 })
    }

    const cleanEmail = email ? String(email).trim().toLowerCase() : null
    const cleanPhone = phone ? String(phone).trim() : null
    const names = String(fullName || "Lead").trim().split(/\s+/)
    const firstName = names[0] || "Lead"
    const lastName = names.slice(1).join(" ") || ""

    // 1. Ingest/Upsert directly into NEXLIN Core Contact table scoped to resolved agencyId
    let contact = await db.contact.findFirst({
      where: {
        agencyId,
        ...(cleanEmail ? { email: cleanEmail } : { phone: cleanPhone! })
      }
    })

    if (!contact) {
      contact = await db.contact.create({
        data: {
          agencyId,
          firstName,
          lastName,
          email: cleanEmail || undefined,
          phone: cleanPhone || undefined,
          tags: "forge_lead",
          leadScore: 50
        }
      })
    } else {
      contact = await db.contact.update({
        where: { id: contact.id },
        data: {
          phone: cleanPhone || contact.phone,
          leadScore: (contact.leadScore || 0) + 25
        }
      })
    }

    // 2. Log in ForgeLead table if funnel belongs to this agency
    if (validFunnelId) {
      await db.forgeLead.create({
        data: {
          funnelId: validFunnelId,
          contactId: contact.id,
          payload: JSON.stringify({
            fullName,
            email: cleanEmail,
            phone: cleanPhone,
            monthlyIncome,
            formName,
            submittedAt: new Date().toISOString()
          })
        }
      })
    }

    // 3. Create agency notification & trigger form submission workflows
    await db.notification
      .create({
        data: {
          agencyId,
          type: "lead",
          title: `New Forge Lead: ${firstName} ${lastName}`.trim(),
          body: `${cleanEmail || cleanPhone || "Lead"} submitted ${formName || "Pre-Qual"}`,
          link: "/crm/contacts"
        }
      })
      .catch(() => {})

    await triggerWorkflowsInternal(agencyId, "form_submitted", {
      contactId: contact.id,
      formName,
      funnelId: validFunnelId,
      siteId
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      message: "Lead ingested into NEXLIN CRM!",
      contactId: contact.id
    })
  } catch (error: any) {
    console.error("Forge Lead Ingest Error:", error)
    return NextResponse.json({ error: error.message || "Failed to ingest lead" }, { status: 500 })
  }
}
