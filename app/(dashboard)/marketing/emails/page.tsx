export const dynamic = 'force-dynamic';
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import MarketingClient from "./MarketingClient"
import { getCampaigns } from "@/app/actions/marketing"

export default async function MarketingPage() {
  const session = await getSession()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const agencyId = "agency-1" // Mock agency ID

  const response = await getCampaigns(agencyId)
  const campaigns = response.data || []

  return <MarketingClient initialCampaigns={campaigns} agencyId={agencyId} />
}

