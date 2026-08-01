"use server"

import { withAgency } from "@/lib/tenant"
import { generateReportHtml } from "@/lib/pdf-report-generator"

export const generateExecutivePdfReport = withAgency(
  async ({ db, agencyId }) => {
    const agency = await db.agency.findFirst({
      where: { id: agencyId },
      select: { name: true }
    })

    const totalLeads = await db.contact.count()
    const deals = await db.deal.findMany({ select: { value: true, stage: true } })
    
    const wonDeals = deals.filter(d => d.stage?.toLowerCase().includes("won") || d.stage?.toLowerCase().includes("closed"))
    const totalDealsWon = wonDeals.length
    const totalRevenue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0)
    const conversionRate = totalLeads > 0 ? Math.round((totalDealsWon / totalLeads) * 100) : 0

    const html = generateReportHtml(agency?.name || "NEXLIN Agency", {
      totalLeads,
      totalDealsWon,
      totalRevenue,
      conversionRate
    })

    return {
      html,
      metrics: {
        totalLeads,
        totalDealsWon,
        totalRevenue,
        conversionRate
      }
    }
  }
)
