"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { requireTenantAuth } from "@/lib/permissions"
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns"

function formatMonthDelta(current: number, previous: number): string {
  if (previous === 0) {
    return current > 0 ? "New this month" : "No prior month data"
  }
  const pct = ((current - previous) / previous) * 100
  const sign = pct >= 0 ? "+" : ""
  return `${sign}${pct.toFixed(1)}% from last month`
}

export async function getDashboardMetrics(_agencyId?: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const agencyId = auth.agencyId
    const now = new Date()
    const currentStart = startOfMonth(now)
    const prevDate = subMonths(now, 1)
    const prevStart = startOfMonth(prevDate)
    const prevEnd = endOfMonth(prevDate)

    const [
      totalContacts,
      totalDeals,
      totalCampaigns,
      deals,
      currContacts,
      prevContacts,
      currDeals,
      prevDeals,
      currCampaigns,
      prevCampaigns,
    ] = await Promise.all([
      db.contact.count({ where: { agencyId } }),
      db.deal.count({ where: { agencyId } }),
      db.campaign.count({ where: { agencyId } }),
      db.deal.findMany({ where: { agencyId }, select: { value: true, createdAt: true } }),
      db.contact.count({ where: { agencyId, createdAt: { gte: currentStart } } }),
      db.contact.count({ where: { agencyId, createdAt: { gte: prevStart, lte: prevEnd } } }),
      db.deal.count({ where: { agencyId, createdAt: { gte: currentStart } } }),
      db.deal.count({ where: { agencyId, createdAt: { gte: prevStart, lte: prevEnd } } }),
      db.campaign.count({ where: { agencyId, createdAt: { gte: currentStart } } }),
      db.campaign.count({ where: { agencyId, createdAt: { gte: prevStart, lte: prevEnd } } }),
    ])

    const pipelineValue = deals.reduce((acc, d) => acc + (d.value || 0), 0)
    const currPipeline = deals
      .filter((d) => d.createdAt >= currentStart)
      .reduce((acc, d) => acc + (d.value || 0), 0)
    const prevPipeline = deals
      .filter((d) => d.createdAt >= prevStart && d.createdAt <= prevEnd)
      .reduce((acc, d) => acc + (d.value || 0), 0)

    return {
      success: true,
      data: {
        totalContacts,
        totalDeals,
        totalCampaigns,
        pipelineValue,
        deltas: {
          contacts: formatMonthDelta(currContacts, prevContacts),
          deals: formatMonthDelta(currDeals, prevDeals),
          pipeline: formatMonthDelta(currPipeline, prevPipeline),
          campaigns: formatMonthDelta(currCampaigns, prevCampaigns),
        },
      },
    }
  } catch (error) {
    console.error("Failed to fetch metrics:", error)
    return { success: false, error: "Failed to fetch metrics" }
  }
}

export async function getAnalyticsData(_agencyId?: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const agencyId = auth.agencyId
    const now = new Date()

    // Build last 6 months array
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(now, 5 - i)
      return {
        label: format(date, "MMM"),
        start: startOfMonth(date),
        end: endOfMonth(date),
      }
    })

    // Contacts added per month
    const contactsByMonth = await Promise.all(
      months.map(async (m) => ({
        month: m.label,
        count: await db.contact.count({
          where: { agencyId, createdAt: { gte: m.start, lte: m.end } }
        })
      }))
    )

    // Deals closed/won per month (pipeline value)
    const dealsByMonth = await Promise.all(
      months.map(async (m) => {
        const monthDeals = await db.deal.findMany({
          where: { agencyId, createdAt: { gte: m.start, lte: m.end } },
          select: { value: true, stage: true }
        })
        const revenue = monthDeals
          .filter(d => d.stage.toLowerCase().includes("won") || d.stage.toLowerCase().includes("closed"))
          .reduce((sum, d) => sum + (d.value || 0), 0)
        return { month: m.label, revenue, total: monthDeals.length }
      })
    )

    // Conversion funnel
    const [totalLeads, openDeals, wonDeals] = await Promise.all([
      db.contact.count({ where: { agencyId } }),
      db.deal.count({ where: { agencyId } }),
      db.deal.count({
        where: {
          agencyId,
          OR: [
            { stage: { contains: "won", mode: "insensitive" } },
            { stage: { contains: "closed", mode: "insensitive" } }
          ]
        }
      })
    ])

    return {
      success: true,
      data: {
        contactsByMonth,
        dealsByMonth,
        funnel: { totalLeads, openDeals, wonDeals }
      }
    }
  } catch (error) {
    console.error("Failed to fetch analytics:", error)
    return { success: false, error: "Failed to fetch analytics" }
  }
}

export async function updateFormFields(formId: string, fields: any[]) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const updated = await db.form.updateMany({
      where: { 
        id: formId,
        agencyId: auth.agencyId
      },
      data: { fields: JSON.stringify(fields) }
    })

    if (updated.count === 0) {
      return { success: false, error: "Form not found" }
    }

    revalidatePath("/forms")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
