"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Mail, Plus, BarChart2, Eye, MousePointerClick,
  Settings, MoreVertical, Sparkles, TrendingUp
} from "lucide-react"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { createCampaign } from "@/app/actions/marketing"
import { generateAiReply } from "@/app/actions/ai"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const templates = [
  { id: 1, name: "Product Launch", category: "Announcement", color: "bg-primary/20 text-primary" },
  { id: 2, name: "Welcome Series", category: "Onboarding", color: "bg-success/20 text-success" },
  { id: 3, name: "Monthly Digest", category: "Newsletter", color: "bg-warning/20 text-warning" },
  { id: 4, name: "Flash Sale", category: "Promotion", color: "bg-error/20 text-error" },
]

export default function MarketingClient({ initialCampaigns, agencyId }: { initialCampaigns: any[], agencyId: string }) {
  const [activeTab, setActiveTab] = useState("campaigns")
  const [isCreating, setIsCreating] = useState(false)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const router = useRouter()

  // Derive analytics data from real campaigns grouped by month
  const analyticsData = useMemo(() => {
    const monthMap: Record<string, { month: string; campaigns: number; opens: number }> = {}
    initialCampaigns.forEach((c) => {
      const month = new Date(c.createdAt).toLocaleString("default", { month: "short" })
      if (!monthMap[month]) monthMap[month] = { month, campaigns: 0, opens: 0 }
      monthMap[month].campaigns += 1
      monthMap[month].opens += c.opens || 0
    })
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    return months.map(m => monthMap[m] || { month: m, campaigns: 0, opens: 0 })
  }, [initialCampaigns])

  const handleCreate = async () => {
    setIsCreating(true)
    const res = await createCampaign(agencyId, "New Campaign")
    if (res.success) { router.refresh() }
    setIsCreating(false)
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Marketing</h1>
          <p className="text-text-secondary">Create, send, and analyze your email campaigns.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Settings className="w-4 h-4 mr-2" /> Settings</Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            <Plus className="w-4 h-4 mr-2" /> {isCreating ? "Creating..." : "Create Campaign"}
          </Button>
        </div>
      </div>

      <div className="flex border-b border-border">
        <button 
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 'campaigns' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
          onClick={() => setActiveTab('campaigns')}
        >
          Campaigns
        </button>
        <button 
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 'templates' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
          onClick={() => setActiveTab('templates')}
        >
          Templates
        </button>
        <button 
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 'analytics' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
      </div>

      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between mb-2">
                  <h3 className="text-sm font-medium text-text-secondary">Emails Sent (30d)</h3>
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div className="text-3xl font-bold">85,214</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between mb-2">
                  <h3 className="text-sm font-medium text-text-secondary">Avg. Open Rate</h3>
                  <Eye className="w-4 h-4 text-success" />
                </div>
                <div className="text-3xl font-bold">42.8%</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between mb-2">
                  <h3 className="text-sm font-medium text-text-secondary">Avg. Click Rate</h3>
                  <MousePointerClick className="w-4 h-4 text-warning" />
                </div>
                <div className="text-3xl font-bold">14.2%</div>
              </CardContent>
            </Card>
            <Card className="bg-primary text-white border-none">
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-white/80 mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4" /> AI Optimization</h3>
                <p className="text-xs mb-3 text-white/70">Generate high-converting email copy with Nexlin AI.</p>
                <button
                  onClick={async () => {
                    setIsAiLoading(true)
                    try {
                      await generateAiReply("marketing", "write a compelling email subject line for a product launch")
                      toast.success("AI draft generated! Check your email composer.")
                    } catch {
                      toast.error("AI generation failed. Please try again.")
                    } finally {
                      setIsAiLoading(false)
                    }
                  }}
                  className="bg-white text-primary text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-white/90 transition-colors"
                >
                  {isAiLoading ? "Generating..." : "Generate Campaign"}
                </button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-text-secondary uppercase bg-bg-secondary border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium">Campaign Name</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Sent</th>
                    <th className="px-6 py-4 font-medium">Open Rate</th>
                    <th className="px-6 py-4 font-medium">Clicks</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {initialCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b border-border hover:bg-bg-secondary/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-text-primary">{campaign.name}</td>
                      <td className="px-6 py-4">
                        <Badge variant={
                          campaign.status === 'active' ? 'success' : 
                          campaign.status === 'scheduled' ? 'warning' : 
                          campaign.status === 'draft' ? 'secondary' : 'default'
                        }>
                          {campaign.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">{new Date(campaign.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">0</td>
                      <td className="px-6 py-4 font-medium">0%</td>
                      <td className="px-6 py-4 font-medium">0%</td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" className="w-8 h-8"><MoreVertical className="w-4 h-4" /></Button>
                      </td>
                    </tr>
                  ))}
                  {initialCampaigns.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-text-secondary">No campaigns found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <Card className="h-[300px] border-2 border-dashed border-border bg-bg-secondary/50 hover:bg-primary/5 hover:border-primary/50 transition-colors cursor-pointer group flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-bg-primary border border-border flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-primary/50 group-hover:text-primary transition-all">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors">Create Template</h3>
          </Card>

          {templates.map(template => (
            <Card key={template.id} className="overflow-hidden group cursor-pointer border border-border hover:shadow-md transition-all">
              <div className="h-48 bg-bg-secondary relative flex items-center justify-center border-b border-border">
                <ImageIcon className="w-12 h-12 text-border" />
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" variant="secondary">Preview</Button>
                  <Button size="sm">Use</Button>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{template.name}</h3>
                </div>
                <Badge className={`bg-transparent border-none px-0 ${template.color}`}>{template.category}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-text-secondary">Total Campaigns</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{initialCampaigns.length}</div>
                <p className="text-xs text-text-secondary mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-green-500" /> All time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-text-secondary">Active Campaigns</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{initialCampaigns.filter(c => c.status === 'active').length}</div>
                <p className="text-xs text-text-secondary mt-1">Currently running</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-text-secondary">Drafts</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{initialCampaigns.filter(c => c.status === 'draft').length}</div>
                <p className="text-xs text-text-secondary mt-1">Pending send</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">Campaigns Created by Month</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={analyticsData}>
                  <defs>
                    <linearGradient id="cgFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="campaigns" stroke="var(--color-primary)" fill="url(#cgFill)" name="Campaigns" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Email Opens by Month</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="opens" fill="var(--color-primary)" name="Opens" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
