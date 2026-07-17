"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"
import { getOrCreateAgency } from "./agency"
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns"

export async function getDashboardMetrics(agencyId: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const [totalContacts, totalDeals, totalCampaigns, deals] = await Promise.all([
      db.contact.count({ where: { agencyId } }),
      db.deal.count({ where: { agencyId } }),
      db.campaign.count({ where: { agencyId } }),
      db.deal.findMany({ where: { agencyId }, select: { value: true } }),
    ])

    const pipelineValue = deals.reduce((acc, d) => acc + (d.value || 0), 0)

    return { success: true, data: { totalContacts, totalDeals, totalCampaigns, pipelineValue } }
  } catch (error) {
    console.error("Failed to fetch metrics:", error)
    return { success: false, error: "Failed to fetch metrics" }
  }
}

export async function getAnalyticsData(agencyId: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

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
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    await db.form.update({
      where: { id: formId },
      data: { fields: JSON.stringify(fields) }
    })

    revalidatePath("/forms")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
