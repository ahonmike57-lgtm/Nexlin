"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Mail, Plus, Eye, MousePointerClick, Settings, MoreVertical,
  Sparkles, TrendingUp, Image as ImageIcon, Edit, Send, Trash2,
  MessageSquare, Users, Loader2, CheckCircle, Tag
} from "lucide-react"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { createCampaign, sendCampaign } from "@/app/actions/marketing"
import { sendSmsBroadcast } from "@/app/actions/marketing"
import { generateAiReply } from "@/app/actions/ai"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import CampaignEditorModal from "./CampaignEditorModal"

const EMAIL_TEMPLATES = [
  { id: 1, name: "Product Launch", category: "Announcement", color: "bg-primary/20 text-primary" },
  { id: 2, name: "Welcome Series", category: "Onboarding", color: "bg-success/20 text-success" },
  { id: 3, name: "Monthly Digest", category: "Newsletter", color: "bg-warning/20 text-warning" },
  { id: 4, name: "Flash Sale", category: "Promotion", color: "bg-error/20 text-error" },
]

const SMS_CHAR_LIMIT = 160

export default function MarketingClient({ initialCampaigns, agencyId }: { initialCampaigns: any[], agencyId: string }) {
  const [activeTab, setActiveTab] = useState("campaigns")
  const [isCreating, setIsCreating] = useState(false)
  const [campaigns, setCampaigns] = useState<any[]>(initialCampaigns)
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null)

  // Per-row send state
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [confirmSendId, setConfirmSendId] = useState<string | null>(null)

  // SMS Broadcast
  const [smsMessage, setSmsMessage] = useState("")
  const [smsTagFilter, setSmsTagFilter] = useState("")
  const [isSendingBlast, setIsSendingBlast] = useState(false)
  const [blastResult, setBlastResult] = useState<{ sent: number; failed: number; total: number } | null>(null)

  const router = useRouter()

  const analyticsData = useMemo(() => {
    const monthMap: Record<string, { month: string; campaigns: number; opens: number }> = {}
    campaigns.forEach((c) => {
      const month = new Date(c.createdAt).toLocaleString("default", { month: "short" })
      if (!monthMap[month]) monthMap[month] = { month, campaigns: 0, opens: 0 }
      monthMap[month].campaigns += 1
      monthMap[month].opens += c.opens || 0
    })
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    return months.map(m => monthMap[m] || { month: m, campaigns: 0, opens: 0 })
  }, [campaigns])

  const handleCreate = async () => {
    setIsCreating(true)
    const res = await createCampaign(agencyId, "Untitled Campaign")
    if (res.success && res.data) {
      setCampaigns(prev => [res.data, ...prev])
      setEditingCampaign(res.data)
      toast.success("Campaign created! Add your subject and content below.")
    } else {
      toast.error("Failed to create campaign")
    }
    setIsCreating(false)
  }

  const handleSend = async (campaignId: string) => {
    setSendingId(campaignId)
    setConfirmSendId(null)
    const res = await sendCampaign(campaignId)
    if (res.success) {
      toast.success(res.mock
        ? "Sent! (Mock mode — add RESEND_API_KEY to send real emails)"
        : `Sent to ${(res as any).count} contacts!`)
      setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: "completed" } : c))
    } else {
      toast.error(res.error || "Failed to send")
    }
    setSendingId(null)
  }

  const handleSendBlast = async () => {
    if (!smsMessage.trim()) {
      toast.error("Please write a message first")
      return
    }
    setIsSendingBlast(true)
    setBlastResult(null)
    const res = await sendSmsBroadcast(agencyId, smsMessage, smsTagFilter || undefined)
    if (res.success) {
      setBlastResult({ sent: (res as any).sent, failed: (res as any).failed, total: (res as any).total })
      toast.success(`SMS Blast sent! ${(res as any).sent} delivered, ${(res as any).failed} failed.`)
      setSmsMessage("")
      setSmsTagFilter("")
    } else {
      toast.error(res.error || "SMS broadcast failed")
    }
    setIsSendingBlast(false)
  }

  const tabs = [
    { id: "campaigns", label: "Email Campaigns", icon: Mail },
    { id: "sms", label: "SMS Broadcasts", icon: MessageSquare },
    { id: "templates", label: "Templates", icon: ImageIcon },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
  ]

  return (
    <div className="space-y-6">
      {editingCampaign && (
        <CampaignEditorModal
          campaign={editingCampaign}
          onClose={() => setEditingCampaign(null)}
          onSaved={() => router.refresh()}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing</h1>
          <p className="text-text-secondary">Create, send, and analyze your email & SMS campaigns.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Settings className="w-4 h-4 mr-2" /> Settings</Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            {isCreating ? "Creating..." : "New Campaign"}
          </Button>
        </div>
      </div>

      <div className="flex border-b border-border gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`flex items-center gap-2 px-5 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Email Campaigns Tab ── */}
      {activeTab === "campaigns" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-5"><div className="flex justify-between mb-1"><span className="text-xs text-text-secondary">Total Campaigns</span><Mail className="w-4 h-4 text-primary" /></div><div className="text-3xl font-bold">{campaigns.length}</div></CardContent></Card>
            <Card><CardContent className="p-5"><div className="flex justify-between mb-1"><span className="text-xs text-text-secondary">Active</span><CheckCircle className="w-4 h-4 text-success" /></div><div className="text-3xl font-bold">{campaigns.filter(c => c.status === "active" || c.status === "completed").length}</div></CardContent></Card>
            <Card><CardContent className="p-5"><div className="flex justify-between mb-1"><span className="text-xs text-text-secondary">Avg. Open Rate</span><Eye className="w-4 h-4 text-warning" /></div><div className="text-3xl font-bold">42.8%</div></CardContent></Card>
            <Card className="bg-primary text-white border-none"><CardContent className="p-5">
              <h3 className="text-sm font-medium text-white/80 mb-1 flex items-center gap-2"><Sparkles className="w-4 h-4" />AI Optimization</h3>
              <p className="text-xs mb-3 text-white/70">Create a campaign and use AI to write the body.</p>
              <button onClick={handleCreate} className="bg-white text-primary text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-white/90 transition-colors">
                Generate Campaign
              </button>
            </CardContent></Card>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-text-secondary uppercase bg-bg-secondary border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium">Campaign Name</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Subject</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b border-border hover:bg-bg-secondary/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-text-primary">{campaign.name}</td>
                      <td className="px-6 py-4">
                        <Badge variant={
                          campaign.status === "completed" ? "success" :
                          campaign.status === "active" ? "success" :
                          campaign.status === "scheduled" ? "warning" :
                          "secondary"
                        }>
                          {campaign.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-text-secondary truncate max-w-[200px]">
                        {campaign.subject && campaign.subject !== "New Campaign Subject" ? campaign.subject : <span className="italic text-text-secondary/50">No subject</span>}
                      </td>
                      <td className="px-6 py-4 text-text-secondary">{new Date(campaign.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs gap-1.5"
                            onClick={() => setEditingCampaign(campaign)}
                          >
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </Button>

                          {campaign.status === "completed" ? (
                            <Badge variant="success" className="text-xs">Sent</Badge>
                          ) : confirmSendId === campaign.id ? (
                            <div className="flex items-center gap-1">
                              <Button size="sm" className="h-7 text-xs" onClick={() => handleSend(campaign.id)} disabled={!!sendingId}>
                                {sendingId === campaign.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirm"}
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setConfirmSendId(null)}>Cancel</Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              className="h-8 text-xs gap-1.5"
                              onClick={() => setConfirmSendId(campaign.id)}
                              disabled={!!sendingId}
                            >
                              <Send className="w-3.5 h-3.5" /> Send
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {campaigns.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">
                        <Mail className="w-8 h-8 mx-auto mb-3 text-border" />
                        <p className="font-medium">No campaigns yet</p>
                        <p className="text-xs mt-1">Click &ldquo;New Campaign&rdquo; to get started.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── SMS Broadcasts Tab ── */}
      {activeTab === "sms" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Composer */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Compose SMS Broadcast
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <Tag className="w-4 h-4 text-text-secondary" /> Filter by Tag (Optional)
                  </label>
                  <input
                    value={smsTagFilter}
                    onChange={(e) => setSmsTagFilter(e.target.value)}
                    placeholder="e.g. 'hot-lead', 'vip-client' — leave empty to send to all"
                    className="w-full text-sm bg-bg-secondary border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-text-secondary mt-1">Only contacts with this tag and a phone number will receive the SMS.</p>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-text-secondary" /> Message
                    </label>
                    <span className={`text-xs ${smsMessage.length > SMS_CHAR_LIMIT ? "text-error font-bold" : "text-text-secondary"}`}>
                      {smsMessage.length}/{SMS_CHAR_LIMIT}
                    </span>
                  </div>
                  <textarea
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    rows={5}
                    placeholder="Hey {{first_name}}, we have an exclusive offer just for you! Reply STOP to unsubscribe."
                    className="w-full text-sm bg-bg-secondary border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                  <p className="text-xs text-text-secondary mt-1">
                    Use <code className="bg-bg-secondary px-1 rounded">{"{{first_name}}"}</code> to personalize. Messages over {SMS_CHAR_LIMIT} chars may be split.
                  </p>
                </div>

                {blastResult && (
                  <div className="flex items-center gap-4 p-4 bg-success/10 border border-success/30 rounded-xl text-sm">
                    <CheckCircle className="w-5 h-5 text-success shrink-0" />
                    <div>
                      <p className="font-semibold text-success">Blast sent successfully!</p>
                      <p className="text-text-secondary text-xs">{blastResult.sent} delivered · {blastResult.failed} failed · {blastResult.total} total contacts</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    onClick={handleSendBlast}
                    disabled={isSendingBlast || !smsMessage.trim()}
                    className="gap-2"
                  >
                    {isSendingBlast ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {isSendingBlast ? "Sending..." : "Send SMS Blast"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">📱 SMS Best Practices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-text-secondary">
                <p>• Keep messages under 160 characters for a single SMS segment.</p>
                <p>• Always include an opt-out option: <em>"Reply STOP to unsubscribe"</em>.</p>
                <p>• Personalize with <code className="bg-bg-secondary px-1 rounded text-xs">{"{{first_name}}"}</code> to boost response rates by up to 26%.</p>
                <p>• Send between 9AM–8PM in the recipient&apos;s local time.</p>
                <p>• Use a tag filter to micro-target specific segments.</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 text-sm">
                <p className="font-semibold text-text-primary mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> Live Delivery
                </p>
                <p className="text-text-secondary text-xs">Add your <code className="bg-bg-secondary px-1 rounded">TWILIO_ACCOUNT_SID</code>, <code className="bg-bg-secondary px-1 rounded">TWILIO_AUTH_TOKEN</code>, and <code className="bg-bg-secondary px-1 rounded">TWILIO_PHONE_NUMBER</code> to your <code className="bg-bg-secondary px-1 rounded">.env</code> file to enable real SMS delivery. Currently running in mock mode.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── Templates Tab ── */}
      {activeTab === "templates" && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <Card className="h-[300px] border-2 border-dashed border-border bg-bg-secondary/50 hover:bg-primary/5 hover:border-primary/50 transition-colors cursor-pointer group flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-bg-primary border border-border flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-primary/50 group-hover:text-primary transition-all">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors">Create Template</h3>
          </Card>
          {EMAIL_TEMPLATES.map(template => (
            <Card key={template.id} className="overflow-hidden group cursor-pointer border border-border hover:shadow-md transition-all">
              <div className="h-48 bg-bg-secondary relative flex items-center justify-center border-b border-border">
                <ImageIcon className="w-12 h-12 text-border" />
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

      {/* ── Analytics Tab ── */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-text-secondary">Total Campaigns</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{campaigns.length}</div><p className="text-xs text-text-secondary mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-green-500" /> All time</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-text-secondary">Sent</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{campaigns.filter(c => c.status === "completed").length}</div><p className="text-xs text-text-secondary mt-1">Delivered to contacts</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-text-secondary">Drafts</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{campaigns.filter(c => c.status === "draft").length}</div><p className="text-xs text-text-secondary mt-1">Pending send</p></CardContent></Card>
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
