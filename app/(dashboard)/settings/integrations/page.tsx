"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Zap, Webhook, Link2, CheckCircle2, ShieldCheck, ExternalLink, Settings, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export interface IntegrationItem {
  id: string
  name: string
  category: "Payments" | "AI & Voice" | "Telephony & Messaging" | "CRM & Sales" | "Ads & E-Commerce" | "Developer & Webhooks"
  description: string
  authType: "OAuth 2.0" | "API Key" | "Webhook" | "Config"
  status: "connected" | "not_connected"
  badge?: string
}

const TOP_30_INTEGRATIONS: IntegrationItem[] = [
  // Payments & Invoicing (6)
  { id: "stripe", name: "Stripe Payment Gateway", category: "Payments", description: "Process credit cards, recurring SaaS billing, and automated dunning loops.", authType: "OAuth 2.0", status: "connected", badge: "Official" },
  { id: "paypal", name: "PayPal Commerce", category: "Payments", description: "Global checkout processing and recurring subscription payments.", authType: "OAuth 2.0", status: "not_connected" },
  { id: "quickbooks", name: "QuickBooks Online", category: "Payments", description: "Two-way accounting ledger, invoice sync, and sales tax reporting.", authType: "OAuth 2.0", status: "not_connected", badge: "Finance" },
  { id: "xero", name: "Xero Accounting Bridge", category: "Payments", description: "Real-time general ledger synchronization and transaction export.", authType: "OAuth 2.0", status: "connected" },
  { id: "authorizenet", name: "Authorize.Net", category: "Payments", description: "Merchant account gateway for high-volume credit card transactions.", authType: "API Key", status: "not_connected" },
  { id: "chargebee", name: "Chargebee Subscription Manager", category: "Payments", description: "Enterprise SaaS subscription management and credit notes.", authType: "API Key", status: "not_connected" },

  // AI & Machine Learning (6)
  { id: "openai", name: "OpenAI GPT-4 Copilot", category: "AI & Voice", description: "Bring GPT-4 directly into pipeline automations, email responses, and live chat.", authType: "API Key", status: "connected", badge: "Featured" },
  { id: "elevenlabs", name: "ElevenLabs Voice Agents", category: "AI & Voice", description: "Hyper-realistic conversational AI voice models for inbound/outbound calls.", authType: "API Key", status: "connected", badge: "Popular" },
  { id: "retell", name: "Retell AI Phone Reps", category: "AI & Voice", description: "Low-latency appointment booking voice bots and customer rep calls.", authType: "API Key", status: "not_connected" },
  { id: "vapi", name: "Vapi Voice AI Engine", category: "AI & Voice", description: "Custom telephony voice pipeline orchestrator with custom LLM backends.", authType: "API Key", status: "not_connected" },
  { id: "claude", name: "Anthropic Claude 3.5", category: "AI & Voice", description: "Advanced reasoning AI model for long-form blog drafting and complex copy.", authType: "API Key", status: "not_connected" },
  { id: "gemini", name: "Google Gemini 1.5 Pro", category: "AI & Voice", description: "Multimodal AI processing for vision analysis and document reading.", authType: "API Key", status: "connected" },

  // Telephony & Messaging (6)
  { id: "twilio", name: "Twilio Telephony & A2P 10DLC", category: "Telephony & Messaging", description: "Native 2-way SMS/MMS, number purchasing, and A2P brand registration.", authType: "API Key", status: "connected", badge: "Essential" },
  { id: "whatsapp", name: "Meta WhatsApp Business API", category: "Telephony & Messaging", description: "Official Meta Cloud API connection for 2-way WhatsApp inbox messaging.", authType: "OAuth 2.0", status: "connected", badge: "Official" },
  { id: "zoom", name: "Zoom Meetings Integration", category: "Telephony & Messaging", description: "Auto-generate video conference links for calendar appointment bookings.", authType: "OAuth 2.0", status: "connected" },
  { id: "ringcentral", name: "RingCentral Cloud VoIP", category: "Telephony & Messaging", description: "Inbound business call routing, extensions, and call log tracking.", authType: "OAuth 2.0", status: "not_connected" },
  { id: "slack", name: "Slack Team Notifications", category: "Telephony & Messaging", description: "Post real-time alerts to Slack channels when new leads fill forms.", authType: "OAuth 2.0", status: "not_connected" },
  { id: "telegram", name: "Telegram Community Bot", category: "Telephony & Messaging", description: "Broadcast marketing announcements to Telegram groups and channels.", authType: "API Key", status: "not_connected" },

  // CRM & Lead Sync (4)
  { id: "hubspot", name: "HubSpot Migration Wizard", category: "CRM & Sales", description: "One-click migration transferring contacts, companies, and deals from HubSpot.", authType: "OAuth 2.0", status: "not_connected" },
  { id: "salesforce", name: "Salesforce Enterprise Sync", category: "CRM & Sales", description: "Bi-directional data sync linking agency leads to enterprise Salesforce orgs.", authType: "OAuth 2.0", status: "not_connected" },
  { id: "calendly", name: "Calendly Event Importer", category: "CRM & Sales", description: "Import third-party Calendly event types and booking links into Nexlin.", authType: "API Key", status: "connected" },
  { id: "linkedin", name: "LinkedIn Lead Gen Forms", category: "CRM & Sales", description: "Ingest professional lead form submissions directly from LinkedIn Ads.", authType: "OAuth 2.0", status: "connected" },

  // Ads & E-Commerce (4)
  { id: "shopify", name: "Shopify Core E-Commerce", category: "Ads & E-Commerce", description: "Live product catalog, order events, and abandoned cart SMS triggers.", authType: "OAuth 2.0", status: "connected", badge: "E-Commerce" },
  { id: "woocommerce", name: "WooCommerce WordPress Sync", category: "Ads & E-Commerce", description: "Connect WordPress store orders and trigger post-purchase workflows.", authType: "Config", status: "not_connected" },
  { id: "googleads", name: "Google Ads Offline Attribution", category: "Ads & E-Commerce", description: "Pass closed CRM deal revenue back to Google Ads for Smart Bidding.", authType: "OAuth 2.0", status: "not_connected" },
  { id: "metaads", name: "Meta Lead Ads Instant Sync", category: "Ads & E-Commerce", description: "Real-time instant lead ingest from Facebook & Instagram ad forms.", authType: "OAuth 2.0", status: "connected", badge: "Popular" },

  // Developer & Webhooks (4)
  { id: "zapier", name: "Zapier Integration Hub", category: "Developer & Webhooks", description: "Trigger Zaps across 5,000+ external web applications automatically.", authType: "Config", status: "connected", badge: "Official" },
  { id: "make", name: "Make (Integromat) Connector", category: "Developer & Webhooks", description: "Complex visual scenario automation bridge for webhooks.", authType: "Webhook", status: "not_connected" },
  { id: "webhooks", name: "Custom Webhook Endpoints", category: "Developer & Webhooks", description: "Send & receive signed JSON HTTP POST payloads to exterior systems.", authType: "Webhook", status: "connected" },
  { id: "openapi", name: "Open API v2 Gateway", category: "Developer & Webhooks", description: "REST API gateway with SHA-256 hashed keys for custom backend builds.", authType: "API Key", status: "connected", badge: "Developer" }
]

export default function IntegrationsSettingsPage() {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [selectedApp, setSelectedApp] = useState<IntegrationItem | null>(null)
  const [apiKeyInput, setApiKeyInput] = useState("")
  const [connecting, setConnecting] = useState(false)

  const filtered = TOP_30_INTEGRATIONS.filter(item => {
    const matchesCategory = activeCategory === "all" || item.category.toLowerCase().includes(activeCategory.toLowerCase())
    const matchesSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.description.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleConnect = async () => {
    if (!selectedApp) return
    setConnecting(true)

    // Simulating OAuth / API Key connection exchange
    setTimeout(() => {
      toast.success(`Successfully connected ${selectedApp.name}!`)
      setConnecting(false)
      setSelectedApp(null)
      setApiKeyInput("")
    }, 1000)
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-text-primary">Top 30 Integrations Dashboard</h2>
          <p className="text-text-secondary mt-1">Connect payments, AI models, messaging channels, ads, and CRM sync tools.</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <Input
            placeholder="Search integrations..."
            className="pl-9 bg-bg-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border text-xs">
        {['all', 'Payments', 'AI & Voice', 'Telephony & Messaging', 'CRM & Sales', 'Ads & E-Commerce', 'Developer & Webhooks'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-colors whitespace-nowrap ${activeCategory === cat ? 'bg-primary text-white' : 'bg-bg-primary text-text-secondary hover:bg-bg-secondary'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of 30 Integrations */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <Card key={item.id} className="bg-bg-primary border-border flex flex-col justify-between hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] uppercase font-semibold">{item.category}</Badge>
                {item.badge && <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">{item.badge}</Badge>}
              </div>
              <CardTitle className="text-base flex items-center justify-between">
                <span>{item.name}</span>
                {item.status === 'connected' ? (
                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                ) : null}
              </CardTitle>
              <CardDescription className="text-xs text-text-secondary line-clamp-2 mt-1">
                {item.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs">
                <span className="text-text-secondary font-mono text-[11px]">Auth: {item.authType}</span>
                {item.status === 'connected' ? (
                  <Button variant="ghost" size="sm" className="h-7 text-success font-semibold" onClick={() => setSelectedApp(item)}>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="h-7" onClick={() => setSelectedApp(item)}>
                    Connect
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Connect Modal */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="sm:max-w-[480px] bg-bg-primary border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" /> Connect {selectedApp?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-4 py-2">
              <p className="text-xs text-text-secondary">{selectedApp.description}</p>

              {selectedApp.authType === "API Key" ? (
                <div className="space-y-1">
                  <label className="text-xs font-medium">Secret API Key / Token</label>
                  <Input
                    type="password"
                    placeholder="sk_live_••••••••••••••••"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                  />
                  <p className="text-[11px] text-text-secondary">Your API Key will be encrypted at rest using AES-256-GCM.</p>
                </div>
              ) : selectedApp.authType === "OAuth 2.0" ? (
                <div className="p-3 bg-bg-secondary rounded-lg border border-border text-xs text-text-secondary space-y-1">
                  <div className="font-semibold text-text-primary">OAuth 2.0 Authorization</div>
                  <p>You will be redirected to {selectedApp.name} to grant secure access credentials.</p>
                </div>
              ) : (
                <div className="p-3 bg-bg-secondary rounded-lg border border-border text-xs text-text-secondary space-y-1">
                  <div className="font-semibold text-text-primary">Webhook Endpoint Listener</div>
                  <p className="font-mono text-[11px]">https://youragency.nexlin.io/api/webhooks/{selectedApp.id}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setSelectedApp(null)}>Cancel</Button>
                <Button onClick={handleConnect} disabled={connecting}>
                  {connecting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <ShieldCheck className="w-4 h-4 mr-1" />}
                  {selectedApp.authType === "OAuth 2.0" ? "Authorize via OAuth" : "Save Integration"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
