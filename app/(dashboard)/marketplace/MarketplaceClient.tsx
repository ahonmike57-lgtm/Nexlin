"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Download, Trash2, ShieldCheck, CheckCircle2, Store, Sparkles, CreditCard, MessageSquare, Megaphone } from "lucide-react"
import { installExtension, uninstallExtension } from "@/app/actions/extensions"

const MOCK_CATEGORIES = [
  { id: "ai", name: "AI & Voice", icon: Sparkles },
  { id: "payments", name: "Payments", icon: CreditCard },
  { id: "comms", name: "Communications", icon: MessageSquare },
  { id: "marketing", name: "Marketing", icon: Megaphone }
]

const BEST_IN_CLASS_APPS = [
  {
    id: "stripe-sync",
    name: "Stripe Sync",
    version: "2.1.0",
    description: "Deeply integrate Stripe payments and subscriptions into Nexlin CRM.",
    category: "payments",
    developer: "Nexlin Official",
    icon: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg"
  },
  {
    id: "elevenlabs-voice",
    name: "ElevenLabs Voice Agents",
    version: "1.0.5",
    description: "Deploy ultra-realistic AI voice agents for inbound and outbound calling.",
    category: "ai",
    developer: "ElevenLabs",
    icon: "https://images.crunchbase.com/image/upload/c_pad,f_auto,q_auto:eco,dpr_1/ub9k9okg1vofm7r4u6h2"
  },
  {
    id: "twilio-sms",
    name: "Twilio Connect",
    version: "3.4.1",
    description: "Send automated SMS and handle A2P 10DLC compliance automatically.",
    category: "comms",
    developer: "Nexlin Official",
    icon: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Twilio-logo-red.svg"
  },
  {
    id: "openai-copilot",
    name: "OpenAI Workflow Copilot",
    version: "1.2.0",
    description: "Bring GPT-4 directly into your pipeline automations and chat inbox.",
    category: "ai",
    developer: "OpenAI",
    icon: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg"
  }
]

export default function MarketplaceClient({ initialExtensions, initialInstalls, agencyId }: { initialExtensions: any[], initialInstalls: any[], agencyId: string }) {
  const [extensions] = useState(initialExtensions)
  const [installs, setInstalls] = useState(initialInstalls)
  const [activeCategory, setActiveCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleInstall = async (extensionId: string) => {
    setProcessingId(extensionId)
    // Here we would normally collect config in a modal
    const res = await installExtension(agencyId, extensionId, { token: "demo-token" })
    if (res.success && res.install) {
      setInstalls([...installs, res.install])
    }
    setProcessingId(null)
  }

  const handleUninstall = async (installId: string, extensionId: string) => {
    setProcessingId(extensionId)
    const res = await uninstallExtension(agencyId, extensionId)
    if (res.success) {
      setInstalls(installs.filter(i => i.id !== installId))
    }
    setProcessingId(null)
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-primary/10 to-transparent p-8 rounded-2xl border border-primary/20 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Store className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">App Marketplace</h1>
          </div>
          <p className="text-text-secondary max-w-xl text-lg">
            Supercharge your CRM with best-in-class integrations. Connect payments, AI voices, and automation tools instantly.
          </p>
        </div>
        <div className="w-full md:w-auto relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <Input 
            type="text" 
            placeholder="Search for apps..." 
            className="w-full pl-10 py-6 text-lg rounded-xl border-border focus:ring-primary/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Categories */}
        <div className="w-full md:w-64 shrink-0 space-y-2">
          <h3 className="font-semibold text-sm text-text-secondary uppercase tracking-wider mb-4 px-2">Categories</h3>
          <Button 
            variant={activeCategory === "all" ? "default" : "ghost"} 
            className={`w-full justify-start ${activeCategory === "all" ? "" : "text-text-secondary hover:text-text-primary"}`}
            onClick={() => setActiveCategory("all")}
          >
            <Store className="w-4 h-4 mr-2" /> All Apps
          </Button>
          {MOCK_CATEGORIES.map(cat => (
            <Button 
              key={cat.id}
              variant={activeCategory === cat.id ? "default" : "ghost"} 
              className={`w-full justify-start ${activeCategory === cat.id ? "" : "text-text-secondary hover:text-text-primary"}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <cat.icon className="w-4 h-4 mr-2" /> {cat.name}
            </Button>
          ))}
        </div>

        {/* Apps Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {BEST_IN_CLASS_APPS.filter(app => activeCategory === "all" || app.category === activeCategory).map((app) => {
              // Map mock UI apps to DB extensions if they exist, else treat as UI only
              const dbExt = extensions.find(e => e.name === app.name)
              const install = dbExt ? installs.find(i => i.extensionId === dbExt.id) : null
              const isInstalled = !!install

              return (
                <Card key={app.id} className="border border-border hover:border-primary/30 transition-colors flex flex-col group">
                  <CardHeader className="flex flex-row items-start gap-4 pb-4">
                    <div className="w-16 h-16 rounded-xl bg-white border border-border flex items-center justify-center overflow-hidden p-2 shrink-0 group-hover:scale-105 transition-transform">
                      {/* Using regular img for external urls to bypass Next/Image domain strictness for this demo */}
                      <img src={app.icon} alt={app.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl">{app.name}</CardTitle>
                        {isInstalled && <Badge variant="success" className="ml-2"><CheckCircle2 className="w-3 h-3 mr-1" /> Installed</Badge>}
                      </div>
                      <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
                        By <span className="font-medium text-text-primary">{app.developer}</span> • v{app.version}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <CardDescription className="text-sm">
                      {app.description}
                    </CardDescription>
                  </CardContent>
                  <CardFooter className="pt-4 border-t border-border mt-auto flex justify-between items-center bg-bg-secondary/30">
                    <div className="flex items-center text-xs text-text-secondary">
                      <ShieldCheck className="w-4 h-4 mr-1 text-success" /> Verified Partner
                    </div>
                    {dbExt ? (
                      isInstalled ? (
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => handleUninstall(install.id, dbExt.id)}
                          disabled={processingId === dbExt.id}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {processingId === dbExt.id ? "Uninstalling..." : "Uninstall"}
                        </Button>
                      ) : (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleInstall(dbExt.id)}
                          disabled={processingId === dbExt.id}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {processingId === dbExt.id ? "Installing..." : "Install App"}
                        </Button>
                      )
                    ) : (
                      <Button variant="outline" size="sm" disabled>Coming Soon</Button>
                    )}
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
