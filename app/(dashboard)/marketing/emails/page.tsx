export const dynamic = 'force-dynamic';
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getOrCreateAgency } from "@/app/actions/agency"
import MarketingClient from "./MarketingClient"
import { getCampaigns } from "@/app/actions/marketing"

export default async function MarketingPage() {
  const session = await getSession()
  if (!session?.user?.id) redirect("/login")

  const agencyId = await getOrCreateAgency()
  const response = await getCampaigns(agencyId)
  const campaigns = response.data || []

  return <MarketingClient initialCampaigns={campaigns} agencyId={agencyId} />
}
