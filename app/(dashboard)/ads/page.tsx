export const dynamic = 'force-dynamic';
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getAdCampaigns } from "@/app/actions/ads"
import AdsClient from "./AdsClient"

export default async function AdsPage() {
  const session = await getSession()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const agencyId = "agency-1" // Mock agency ID

  const res = await getAdCampaigns(agencyId)
  
  let initialCampaigns: any[] = res.success && res.campaigns ? res.campaigns : []
  
  if (initialCampaigns.length === 0) {
    initialCampaigns = [
      { id: "mock-1", platform: "google", name: "Summer Sale Search", status: "active", budget: 1500, spend: 450.25, impressions: 12500, clicks: 450, conversions: 23, createdAt: new Date() },
      { id: "mock-2", platform: "facebook", name: "Retargeting Q3", status: "active", budget: 800, spend: 320.10, impressions: 24000, clicks: 612, conversions: 15, createdAt: new Date() },
      { id: "mock-3", platform: "tiktok", name: "Brand Awareness", status: "paused", budget: 500, spend: 500, impressions: 85000, clicks: 1200, conversions: 8, createdAt: new Date() },
    ]
  }

  return <AdsClient initialCampaigns={initialCampaigns} agencyId={agencyId} />
}

