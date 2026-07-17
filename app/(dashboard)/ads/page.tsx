export const dynamic = 'force-dynamic';
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getOrCreateAgency } from "@/app/actions/agency"
import AdsClient from "./AdsClient"
import { getAdCampaigns } from "@/app/actions/ads"

export default async function AdsPage() {
  const session = await getSession()
  if (!session?.user?.id) redirect("/login")

  const agencyId = await getOrCreateAgency()
  const res = await getAdCampaigns(agencyId)
  const initialCampaigns = res.success && res.campaigns ? res.campaigns : []

  return <AdsClient initialCampaigns={initialCampaigns} agencyId={agencyId} />
}
