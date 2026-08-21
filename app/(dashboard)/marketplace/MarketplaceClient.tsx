"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Download, Trash2, ShieldCheck, CheckCircle2, Store, Sparkles, CreditCard, MessageSquare, Megaphone, Zap, Loader2 } from "lucide-react"
import { installApp, uninstallApp } from "@/app/actions/marketplace"
import { toast } from "sonner"

export default function MarketplaceClient({ initialApps, initialInstalls }: { initialApps: any[], initialInstalls: any[], agencyId?: string }) {
  const [apps] = useState(initialApps)
  const [installs, setInstalls] = useState(initialInstalls)
  const [activeCategory, setActiveCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [processingId, setProcessingId] = useState<string | null>(null)

  const categories = ["all", "Payments", "AI", "Communication", "Automation", "Marketing", "E-Commerce", "CRM", "Support", "Installed"]

  const handleInstall = async (appId: string) => {
    setProcessingId(appId)
    const res = await installApp(appId, { installedAt: new Date().toISOString() })
    if (res.success && res.install) {
      toast.success("App installed successfully!")
      setInstalls([...installs, res.install])
    } else {
      toast.error(res.error || "Failed to install app")
    }
    setProcessingId(null)
  }

  const handleUninstall = async (appId: string) => {
    setProcessingId(appId)
    const res = await uninstallApp(appId)
    if (res.success) {
      toast.success("App uninstalled")
      setInstalls(installs.filter(i => i.appId !== appId))
    } else {
      toast.error(res.error || "Failed to uninstall app")
    }
    setProcessingId(null)
  }

  const filteredApps = apps.filter(app => {
    const isInstalled = installs.some(i => i.appId === app.id)

    if (activeCategory === "Installed") {
      if (!isInstalled) return false
    } else if (activeCategory !== "all") {
      if (app.category.toLowerCase() !== activeCategory.toLowerCase()) return false
    }

    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      app.name.toLowerCase().includes(q) ||
      (app.description || "").toLowerCase().includes(q) ||
      app.category.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-primary/10 to-transparent p-8 rounded-2xl border border-primary/20 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Store className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">App Marketplace</h1>
          </div>
          <p className="text-text-secondary max-w-xl text-lg">
            Supercharge your CRM with 30+ enterprise integrations. Connect payments, AI voices, telephony, and marketing automation tools instantly.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <Link href="/marketplace/prompts">
            <Button variant="outline" className="bg-bg-primary h-12">
              <Sparkles className="w-4 h-4 mr-2 text-primary" /> Prompt Library
            </Button>
          </Link>
          <div className="w-full md:w-auto relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <Input 
              type="text" 
              placeholder="Search 30+ integrations..." 
              className="w-full pl-10 py-6 text-sm rounded-xl border-border focus:ring-primary/50 bg-bg-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Categories */}
        <div className="w-full md:w-56 shrink-0 space-y-1">
          <h3 className="font-semibold text-xs text-text-secondary uppercase tracking-wider mb-3 px-2">Categories</h3>
          {categories.map(cat => {
            const isInstalledTab = cat === "Installed"
            const count = isInstalledTab 
              ? installs.length 
              : cat === "all" 
              ? apps.length 
              : apps.filter(a => a.category.toLowerCase() === cat.toLowerCase()).length

            return (
              <Button 
                key={cat}
                variant={activeCategory === cat ? "default" : "ghost"} 
                className={`w-full justify-between capitalize ${activeCategory === cat ? "" : "text-text-secondary hover:text-text-primary"}`}
                onClick={() => setActiveCategory(cat)}
              >
                <span className="flex items-center gap-2">
                  {isInstalledTab ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Store className="w-4 h-4" />}
                  {cat}
                </span>
                <span className="text-xs opacity-70">({count})</span>
              </Button>
            )
          })}
        </div>

        {/* Apps Grid */}
        <div className="flex-1">
          {filteredApps.length === 0 ? (
            <div className="text-center py-16 bg-bg-primary rounded-xl border border-border space-y-3">
              <Store className="w-10 h-10 text-text-secondary mx-auto" />
              <h3 className="font-semibold text-lg">No Apps Found</h3>
              <p className="text-sm text-text-secondary">Try searching for a different keyword or category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredApps.map((app) => {
                const isInstalled = installs.some(i => i.appId === app.id)
                const isProcessing = processingId === app.id

                return (
                  <Card key={app.id} className="bg-bg-primary border-border flex flex-col justify-between hover:border-primary/50 transition-colors shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Badge variant="outline" className="text-[10px] uppercase font-semibold">{app.category}</Badge>
                        {app.badge && <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">{app.badge}</Badge>}
                      </div>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{app.name}</span>
                        {isInstalled && <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
                      </CardTitle>
                      <CardDescription className="text-xs text-text-secondary line-clamp-2 mt-1">
                        {app.description}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-3 border-t border-border flex items-center justify-between text-xs">
                      <span className="text-text-secondary font-mono text-[11px]">Auth: {app.installType}</span>
                      {isInstalled ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-error hover:text-error hover:bg-error/10"
                          disabled={isProcessing}
                          onClick={() => handleUninstall(app.id)}
                        >
                          {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Trash2 className="w-3.5 h-3.5 mr-1" />}
                          Uninstall
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          className="h-8"
                          disabled={isProcessing}
                          onClick={() => handleInstall(app.id)}
                        >
                          {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Download className="w-3.5 h-3.5 mr-1" />}
                          Install App
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
