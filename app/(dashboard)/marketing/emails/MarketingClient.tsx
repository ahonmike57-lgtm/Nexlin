"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Mail, Plus, Play, Pause, BarChart2, Eye, MousePointerClick, 
  Settings, MoreVertical, CheckCircle2, Image as ImageIcon
} from "lucide-react"

import { createCampaign } from "@/app/actions/marketing"
import { generateAiReply } from "@/app/actions/ai"
import { useRouter } from "next/navigation"

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

  const handleCreate = async () => {
    setIsCreating(true)
    const res = await createCampaign(agencyId, "New Campaign")
    if (res.success) {
      router.refresh()
    }
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
                <h3 className="text-sm font-medium text-primary-100 mb-2">AI Optimization</h3>
                <p className="text-xs mb-3">Generate high-converting email copy with Nexlin AI.</p>
                <button 
                  onClick={async () => {
                    setIsAiLoading(true)
                    await generateAiReply("marketing", "write email")
                    setIsAiLoading(false)
                    alert("AI Campaign Draft created (Mock)!")
                  }}
                  className="bg-white text-primary text-xs font-semibold px-3 py-1.5 rounded-md"
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
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mb-4 text-primary">
            <BarChart2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Deep Analytics Coming Soon</h3>
          <p className="text-text-secondary max-w-sm">We are integrating advanced machine learning to provide you with predictive email analytics.</p>
        </div>
      )}
    </div>
  )
}
