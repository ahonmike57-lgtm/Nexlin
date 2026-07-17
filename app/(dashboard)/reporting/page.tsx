export const dynamic = 'force-dynamic';
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getOrCreateAgency } from "@/app/actions/agency"
import { getDashboardMetrics, getAnalyticsData } from "@/app/actions/reporting"
import ReportingClient from "./ReportingClient"

export default async function ReportingPage() {
  const session = await getSession()
  if (!session?.user?.id) redirect("/login")

  const agencyId = await getOrCreateAgency()
  const [metricsRes, analyticsRes] = await Promise.all([
    getDashboardMetrics(agencyId),
    getAnalyticsData(agencyId),
  ])

  const metrics = metricsRes.data || { totalContacts: 0, totalDeals: 0, totalCampaigns: 0, pipelineValue: 0 }
  const analytics = analyticsRes.data || { contactsByMonth: [], dealsByMonth: [], funnel: { totalLeads: 0, openDeals: 0, wonDeals: 0 } }

  return <ReportingClient initialMetrics={metrics} analyticsData={analytics} />
}
