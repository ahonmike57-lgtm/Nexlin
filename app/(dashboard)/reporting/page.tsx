export const dynamic = 'force-dynamic';
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import ReportingClient from "./ReportingClient"
import { getDashboardMetrics } from "@/app/actions/reporting"

export default async function ReportingPage() {
  const session = await getSession()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const agencyId = "agency-1"

  const response = await getDashboardMetrics(agencyId)
  const metrics = response.data || { totalContacts: 0, totalDeals: 0, totalCampaigns: 0, pipelineValue: 0 }

  return <ReportingClient initialMetrics={metrics} />
}

