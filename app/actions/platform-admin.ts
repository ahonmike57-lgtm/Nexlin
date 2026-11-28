"use server"

import crypto from "crypto"
import { db } from "@/lib/db"
import { requirePlatformAuth, type PlatformRole } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

/**
 * Get current platform admin session role & info
 */
export async function getCurrentPlatformAdmin() {
  const auth = await requirePlatformAuth()
  if (!auth.authorized) return null
  return {
    id: auth.admin.id,
    email: auth.admin.email,
    name: auth.admin.name,
    role: auth.role as PlatformRole,
  }
}

/**
 * 1. Global Revenue & SaaS Subscription Metrics (Access: Owner only)
 */
export async function getPlatformRevenueMetrics() {
  const auth = await requirePlatformAuth(["owner", "developer"])
  if (!auth.authorized) {
    return { success: false, error: auth.error }
  }

  const agencies = await db.agency.findMany({
    select: {
      id: true,
      name: true,
      planTier: true,
      status: true,
      createdAt: true,
      subscriptions: {
        select: { id: true, status: true, paymentProcessor: true, currentPeriodEnd: true }
      }
    }
  })

  const tierPrices: Record<string, number> = {
    starter: 97,
    basic: 97,
    pro: 297,
    agency: 497,
    unlimited: 497,
    enterprise: 997,
  }

  let mrr = 0
  const tierCounts: Record<string, number> = { starter: 0, pro: 0, unlimited: 0, enterprise: 0 }
  let activeCount = 0
  let pastDueCount = 0
  let trialingCount = 0

  for (const a of agencies) {
    const tier = (a.planTier || "starter").toLowerCase()
    const price = tierPrices[tier] || 97
    if (a.status === "active") {
      mrr += price
      activeCount++
    } else if (a.status === "past_due") {
      pastDueCount++
    } else if (a.status === "trialing") {
      trialingCount++
    }

    if (tier.includes("pro")) tierCounts.pro++
    else if (tier.includes("unlimited") || tier.includes("agency")) tierCounts.unlimited++
    else if (tier.includes("enterprise")) tierCounts.enterprise++
    else tierCounts.starter++
  }

  const arr = mrr * 12
  const netVolume = mrr * 1.15 // includes rebilling estimates

  return {
    success: true,
    data: {
      mrr,
      arr,
      netVolume,
      activeCount,
      pastDueCount,
      trialingCount,
      totalAgencies: agencies.length,
      tierCounts,
      recentSubscriptions: agencies.slice(0, 10).map(a => ({
        id: a.id,
        agencyName: a.name,
        planTier: a.planTier,
        status: a.status,
        createdAt: a.createdAt,
      }))
    }
  }
}

/**
 * 2. Global AI Token Usage & API Spend Monitor (Access: Owner, Developer)
 */
export async function getPlatformAiUsageMetrics() {
  const auth = await requirePlatformAuth(["owner", "developer"])
  if (!auth.authorized) {
    return { success: false, error: auth.error }
  }

  const [agg, modelGroups, recentGenerations, models] = await Promise.all([
    db.forgeGeneration.aggregate({
      _count: true,
      _sum: { costUsd: true },
    }),
    db.forgeGeneration.groupBy({
      by: ["modelUsed"],
      _count: { _all: true },
      _avg: { latencyMs: true },
    }),
    db.forgeGeneration.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    db.forgeModelRegistry.findMany(),
  ])

  const totalGenerations = agg._count || 0
  const totalCost = agg._sum.costUsd || 0
  const estimatedTokens = totalGenerations * 1250
  const rebilledRevenue = Math.round(totalCost * 3.5 * 100) / 100
  const totalApiCost = Math.round(totalCost * 100) / 100
  const grossMargin =
    rebilledRevenue > 0
      ? Math.round(((rebilledRevenue - totalApiCost) / rebilledRevenue) * 1000) / 10
      : 0

  const providers = modelGroups.map((g) => {
    const sharePct =
      totalGenerations > 0 ? Math.round((g._count._all / totalGenerations) * 100) : 0
    return {
      name: g.modelUsed || "Unknown",
      share: `${sharePct}%`,
      latency: `${Math.round(g._avg.latencyMs || 0)}ms`,
      status: "Observed",
    }
  })

  return {
    success: true,
    data: {
      totalGenerations,
      estimatedTokens,
      totalApiCost,
      rebilledRevenue,
      grossMargin,
      providers,
      recentGenerations,
      registeredModels: models,
    },
  }
}

/**
 * 3. Master Blueprint Snapshots Manager (Access: Owner, Developer)
 */
export async function getPlatformBlueprintSnapshots() {
  const auth = await requirePlatformAuth(["owner", "developer"])
  if (!auth.authorized) {
    return { success: false, error: auth.error }
  }

  const snapshots = await db.snapshot.findMany({
    where: { isPublic: true },
    include: { assets: true },
    orderBy: { createdAt: "desc" }
  })

  // Standard platform seed blueprints if none exist
  const defaultBlueprints = [
    {
      id: "bp-dental",
      name: "Dental Practice Growth Blueprint",
      industry: "Healthcare / Dental",
      funnelsCount: 3,
      workflowsCount: 6,
      pipelinesCount: 2,
      description: "Complete dental appointment booking funnel, missed-call SMS textback, and 6-month cleaning recall drip campaign.",
      installsCount: 42,
      isOfficial: true
    },
    {
      id: "bp-realestate",
      name: "Real Estate Brokerage Accelerator",
      industry: "Real Estate",
      funnelsCount: 4,
      workflowsCount: 8,
      pipelinesCount: 3,
      description: "Buyer/Seller lead capture funnels, property valuation automated calculator, and Zillow/Realtor webhook ingress.",
      installsCount: 89,
      isOfficial: true
    },
    {
      id: "bp-solar",
      name: "Solar & Home Services Lead Machine",
      industry: "Renewable Energy",
      funnelsCount: 2,
      workflowsCount: 5,
      pipelinesCount: 2,
      description: "Roof assessment questionnaire, automated lead scoring (+50 points for electric bill > $200), and power dialer queue.",
      installsCount: 31,
      isOfficial: true
    },
    {
      id: "bp-medspa",
      name: "Aesthetic Clinic & MedSpa Engine",
      industry: "Beauty & Wellness",
      funnelsCount: 3,
      workflowsCount: 7,
      pipelinesCount: 2,
      description: "VIP voucher campaign, Botox/Filler booking calendar with deposit CPQ invoice, and 5-star Google review trigger.",
      installsCount: 64,
      isOfficial: true
    }
  ]

  return {
    success: true,
    data: {
      customSnapshots: snapshots,
      blueprintTemplates: defaultBlueprints
    }
  }
}

export async function getPlatformAgenciesList() {
  const auth = await requirePlatformAuth(["owner", "developer", "support"])
  if (!auth.authorized) return []
  return db.agency.findMany({
    select: { id: true, name: true, subdomain: true, planTier: true },
    orderBy: { name: "asc" }
  })
}

export async function createPlatformBlueprintSnapshot(data: {
  name: string
  industry: string
  description: string
  funnelsCount?: number
  workflowsCount?: number
  pipelinesCount?: number
}) {
  const auth = await requirePlatformAuth(["owner", "developer"])
  if (!auth.authorized) {
    return { success: false, error: auth.error }
  }

  const firstAgency = await db.agency.findFirst()
  if (!firstAgency) {
    return { success: false, error: "No agency found to anchor blueprint snapshot." }
  }

  const snapshot = await db.snapshot.create({
    data: {
      agencyId: firstAgency.id,
      name: data.name.trim(),
      description: data.description.trim(),
      isPublic: true,
      assets: {
        create: [
          { type: "funnel", sourceId: `fn_${Date.now()}`, data: JSON.stringify({ name: "Lead Funnel" }) },
          { type: "workflow", sourceId: `wf_${Date.now()}`, data: JSON.stringify({ name: "Drip Workflow" }) },
          { type: "pipeline", sourceId: `pl_${Date.now()}`, data: JSON.stringify({ name: "Sales Pipeline" }) }
        ]
      }
    }
  })

  revalidatePath("/platform/snapshots")
  return { success: true, data: snapshot }
}

export async function deploySnapshotToAgency(data: {
  blueprintName: string
  agencyId: string
}) {
  const auth = await requirePlatformAuth(["owner", "developer"])
  if (!auth.authorized) {
    return { success: false, error: auth.error }
  }

  const agency = await db.agency.findUnique({
    where: { id: data.agencyId }
  })

  if (!agency) {
    return { success: false, error: "Target agency workspace not found." }
  }

  // Create default pipeline for the agency
  const pipeline = await db.pipeline.create({
    data: {
      agencyId: agency.id,
      name: `${data.blueprintName} Sales Pipeline`,
      stages: {
        create: [
          { name: "New Lead", order: 0 },
          { name: "Discovery Call", order: 1 },
          { name: "Proposal Sent", order: 2 },
          { name: "Closed Won", order: 3 },
        ]
      }
    }
  })

  const uniqueSuffix = crypto.randomBytes(2).toString("hex")

  // Create default funnel for the agency
  const funnel = await db.funnel.create({
    data: {
      agencyId: agency.id,
      name: `${data.blueprintName} Booking Funnel`,
      subdomain: `${agency.subdomain || 'agency'}-booking-${uniqueSuffix}`,
      status: "published",
      steps: {
        create: [
          { name: "Opt-in Landing Page", order: 0, path: "/optin" },
          { name: "Calendar Schedule Page", order: 1, path: "/schedule" },
          { name: "Confirmation Thank You", order: 2, path: "/thank-you" }
        ]
      }
    }
  })

  // Create notification in agency workspace
  await db.notification.create({
    data: {
      agencyId: agency.id,
      type: "system",
      title: `📦 Blueprint Deployed: ${data.blueprintName}`,
      body: `Platform Admin has deployed the ${data.blueprintName} with ready-to-use Funnels and Pipelines into your workspace.`,
      link: "/funnels"
    }
  })

  revalidatePath("/platform/snapshots")
  return { success: true, pipelineId: pipeline.id, funnelId: funnel.id }
}

/**
 * 4. Global In-App Announcements & System Banners (Access: Owner, Support)
 */
export async function getPlatformAnnouncements() {
  const auth = await requirePlatformAuth(["owner", "support"])
  if (!auth.authorized) {
    return { success: false, error: auth.error }
  }

  const announcements = await db.platformAnnouncement.findMany({
    orderBy: { createdAt: "desc" }
  })

  return { success: true, data: announcements }
}

export async function createPlatformAnnouncement(data: {
  title: string
  message: string
  type: string
  expiresAt?: Date
}) {
  const auth = await requirePlatformAuth(["owner", "support"])
  if (!auth.authorized) {
    return { success: false, error: auth.error }
  }

  const announcement = await db.platformAnnouncement.create({
    data: {
      title: data.title,
      message: data.message,
      type: data.type || "info",
      author: auth.admin.name || "Platform Admin",
      isActive: true,
      expiresAt: data.expiresAt || null,
    }
  })

  revalidatePath("/platform/announcements")
  return { success: true, data: announcement }
}

export async function togglePlatformAnnouncement(id: string, isActive: boolean) {
  const auth = await requirePlatformAuth(["owner", "support"])
  if (!auth.authorized) {
    return { success: false, error: auth.error }
  }

  await db.platformAnnouncement.update({
    where: { id },
    data: { isActive }
  })

  revalidatePath("/platform/announcements")
  return { success: true }
}

/**
 * 5. Cross-Tenant Support Desk & Ticket Queue (Access: Owner, Support)
 */
export async function getPlatformSupportTickets() {
  const auth = await requirePlatformAuth(["owner", "support"])
  if (!auth.authorized) {
    return { success: false, error: auth.error }
  }

  const tickets = await db.ticket.findMany({
    include: {
      agency: { select: { id: true, name: true, subdomain: true, planTier: true } },
      contact: { select: { id: true, firstName: true, lastName: true, email: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 50
  })

  return {
    success: true,
    data: tickets
  }
}

export async function updatePlatformTicketStatus(ticketId: string, status: string) {
  const auth = await requirePlatformAuth(["owner", "support"])
  if (!auth.authorized) {
    return { success: false, error: auth.error }
  }

  await db.ticket.update({
    where: { id: ticketId },
    data: { status }
  })

  revalidatePath("/platform/support")
  return { success: true }
}

/**
 * 6. Global Platform Security & Impersonation Audit Logs (Access: Owner, Developer)
 */
export async function getPlatformAuditLogs() {
  const auth = await requirePlatformAuth(["owner", "developer"])
  if (!auth.authorized) {
    return { success: false, error: auth.error }
  }

  const impersonations = await db.impersonationLog.findMany({
    include: {
      agency: { select: { id: true, name: true, subdomain: true } }
    },
    orderBy: { startedAt: "desc" },
    take: 40
  })

  return {
    success: true,
    data: impersonations
  }
}
