"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { BarChart3, TrendingUp, DollarSign, MousePointerClick, Eye, Plus } from "lucide-react"
import { createAdCampaign } from "@/app/actions/ads"
import { toast } from "sonner"
import { useState } from "react"

const PLATFORMS = ["Google", "Facebook", "TikTok", "Instagram", "LinkedIn"]

export default function AdsClient({ initialCampaigns, agencyId }: { initialCampaigns: any[], agencyId: string }) {
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [form, setForm] = useState({ name: "", platform: "Google", budget: "" })

  const handleCreate = async () => {
    if (!form.name || !form.budget) { toast.error("Please fill in all fields."); return }
    setIsCreating(true)
    const res = await createAdCampaign(agencyId, {
      name: form.name,
      platform: form.platform.toLowerCase(),
      status: "active",
      budget: parseFloat(form.budget),
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
    })
    if (res.success && res.campaign) {
      toast.success("Campaign created!")
      setCampaigns([res.campaign, ...campaigns])
      setIsOpen(false)
      setForm({ name: "", platform: "Google", budget: "" })
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

  const getPlatformStyle = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "google":    return "bg-red-50 text-red-600 border-red-200"
      case "facebook":  return "bg-blue-50 text-blue-600 border-blue-200"
      case "tiktok":    return "bg-slate-100 text-slate-800 border-slate-300"
      case "instagram": return "bg-pink-50 text-pink-600 border-pink-200"
      case "linkedin":  return "bg-sky-50 text-sky-600 border-sky-200"
      default:          return "bg-gray-50 text-gray-600 border-gray-200"
    }
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ads Manager</h1>
          <p className="text-text-secondary mt-1">Monitor your multi-channel ad campaigns.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New Campaign</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Create Ad Campaign</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Campaign Name</label>
                <Input placeholder="e.g., Summer Sale 2025" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Platform</label>
                <select
                  className="flex h-10 w-full rounded-md border border-border bg-bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.platform}
                  onChange={(e) => setForm({ ...form, platform: e.target.value })}
                >
                  {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Monthly Budget ($)</label>
                <Input type="number" min={1} placeholder="e.g., 2000" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
              </div>
              <Button onClick={handleCreate} disabled={isCreating} className="w-full">
                {isCreating ? "Creating..." : "Create Campaign"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpend.toFixed(2)}</div>
            <p className="text-xs text-text-secondary">of ${totalBudget.toFixed(2)} budget</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
            <p className="text-xs text-text-secondary">{campaigns.length} active campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
            <p className="text-xs text-text-secondary">Avg. CPC: ${avgCpc}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.reduce((a, c) => a + c.conversions, 0)}</div>
            <p className="text-xs text-text-secondary">Total across all campaigns</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold tracking-tight">Campaigns</h2>

      <div className="bg-bg-primary border border-border rounded-xl overflow-hidden shadow-soft">
        {campaigns.length === 0 ? (
          <div className="p-12 text-center">
            <BarChart3 className="w-12 h-12 text-text-secondary mx-auto mb-4 opacity-40" />
            <h3 className="font-semibold mb-2">No campaigns yet</h3>
            <p className="text-text-secondary text-sm mb-4">Create your first campaign to start tracking performance.</p>
            <Button onClick={() => setIsOpen(true)}><Plus className="w-4 h-4 mr-2" /> New Campaign</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-secondary uppercase bg-bg-secondary border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Campaign Name</th>
                  <th className="px-6 py-4 font-medium">Platform</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Budget</th>
                  <th className="px-6 py-4 font-medium text-right">Spend</th>
                  <th className="px-6 py-4 font-medium text-right">Clicks</th>
                  <th className="px-6 py-4 font-medium text-right">Conv.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-text-primary">{campaign.name}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getPlatformStyle(campaign.platform)}`}>
                        {campaign.platform.charAt(0).toUpperCase() + campaign.platform.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${campaign.status === "active" ? "bg-green-500" : "bg-yellow-500"}`} />
                        <span className="capitalize">{campaign.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">${campaign.budget.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">${campaign.spend.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">{campaign.clicks.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-medium">{campaign.conversions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
