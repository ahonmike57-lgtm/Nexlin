"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, DollarSign, MousePointerClick, Eye, Plus } from "lucide-react"
import { createAdCampaign } from "@/app/actions/ads"
import { toast } from "sonner"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function AdsClient({ initialCampaigns, agencyId }: { initialCampaigns: any[], agencyId: string }) {
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [isCreating, setIsCreating] = useState(false)
  
  const handleCreateMock = async () => {
    setIsCreating(true)
    const mockCampaign = {
      name: `Q3 Promo ${Math.floor(Math.random() * 1000)}`,
      platform: ["google", "facebook", "tiktok"][Math.floor(Math.random() * 3)],
      status: "active",
      budget: Math.floor(Math.random() * 5000) + 1000,
      spend: Math.floor(Math.random() * 1000),
      impressions: Math.floor(Math.random() * 50000),
      clicks: Math.floor(Math.random() * 5000),
      conversions: Math.floor(Math.random() * 50)
    }
    const res = await createAdCampaign(agencyId, mockCampaign)
    if (res.success && res.campaign) {
      toast.success("Mock campaign created")
      setCampaigns([res.campaign, ...campaigns])
    } else {
      toast.error("Failed to create campaign")
    }
    setIsCreating(false)
  }

  const totalSpend = campaigns.reduce((acc, curr) => acc + curr.spend, 0)
  const totalBudget = campaigns.reduce((acc, curr) => acc + curr.budget, 0)
  const totalImpressions = campaigns.reduce((acc, curr) => acc + curr.impressions, 0)
  const totalClicks = campaigns.reduce((acc, curr) => acc + curr.clicks, 0)
  const avgCpc = totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) : "0.00"

  const getPlatformColor = (platform: string) => {
    switch(platform) {
      case "google": return "bg-red-50 text-red-600 border-red-200"
      case "facebook": return "bg-blue-50 text-blue-600 border-blue-200"
      case "tiktok": return "bg-slate-100 text-slate-800 border-slate-300"
      default: return "bg-gray-50 text-gray-600 border-gray-200"
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Ads Manager</h1>
          <p className="text-muted-foreground mt-1">Monitor your multi-channel ad campaigns in real-time.</p>
        </div>
        <Button onClick={handleCreateMock} disabled={isCreating}>
          <Plus className="w-4 h-4 mr-2" /> {isCreating ? "Adding..." : "Add Mock Campaign"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpend.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              of ${totalBudget.toFixed(2)} budget
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +5.2% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. CPC</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgCpc}</div>
            <p className="text-xs text-muted-foreground">
              -2.1% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold tracking-tight mt-8 mb-4">Active Campaigns</h2>
      
      <div className="bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 dark:text-slate-400 uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">Campaign Name</th>
                <th className="px-6 py-4 font-medium">Platform</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Spend</th>
                <th className="px-6 py-4 font-medium text-right">Clicks</th>
                <th className="px-6 py-4 font-medium text-right">Conversions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                    {campaign.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getPlatformColor(campaign.platform)}`}>
                      {campaign.platform.charAt(0).toUpperCase() + campaign.platform.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5`}>
                      <span className={`h-2 w-2 rounded-full ${campaign.status === "active" ? "bg-green-500" : "bg-yellow-500"}`}></span>
                      <span className="capitalize">{campaign.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    ${campaign.spend.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {campaign.clicks}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    {campaign.conversions}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
