"use client"

import { useState, useEffect } from "react"
import { getTriggerLinks, createTriggerLink } from "@/app/actions/trigger-links"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Link2, Plus, Copy, ExternalLink, Loader2, Sparkles, Zap, CheckCircle2, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const PRESET_TEMPLATES = [
  {
    name: "⭐ Google 5-Star Review Funnel",
    targetUrl: "https://g.page/review/your-business",
    description: "Awards +20 lead points and prompts happy customers to leave reviews."
  },
  {
    name: "📅 VIP Strategy Session Booking",
    targetUrl: "https://calendly.com/your-agency/strategy",
    description: "Triggers calendar reminder SMS sequence and marks deal as Scheduled."
  },
  {
    name: "🎁 20% Off Flash Promo Link",
    targetUrl: "https://youragency.com/offer/special",
    description: "Notifies sales rep in real-time when high-intent prospect clicks."
  }
]

export default function TriggerLinksSettingsPage() {
  const [links, setLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const [targetUrl, setTargetUrl] = useState("")

  const loadLinks = async () => {
    setLoading(true)
    const res = await getTriggerLinks()
    if (res.success && res.links) {
      setLinks(res.links)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadLinks()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !targetUrl) return

    setSaving(true)
    const res = await createTriggerLink(name, targetUrl)
    if (res.success) {
      toast.success("Trigger link created!")
      setOpen(false)
      setName("")
      setTargetUrl("")
      loadLinks()
    } else {
      toast.error(res.error || "Failed to create link")
    }
    setSaving(false)
  }

  const handleQuickCreate = async (preset: { name: string; targetUrl: string }) => {
    setSaving(true)
    const res = await createTriggerLink(preset.name, preset.targetUrl)
    if (res.success) {
      toast.success(`Preset "${preset.name}" created!`)
      loadLinks()
    } else {
      toast.error(res.error || "Failed to create preset link")
    }
    setSaving(false)
  }

  const copyTrackedUrl = (linkId: string) => {
    const fullUrl = `${window.location.origin}/api/t/${linkId}`
    navigator.clipboard.writeText(fullUrl)
    toast.success("Tracked URL copied to clipboard!")
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Trigger Links</h2>
          <p className="text-text-secondary">Generate tracked URLs that launch complex workflow automations the moment a lead clicks them.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Trigger Link
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px] bg-bg-primary border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-primary" /> New Tracked Trigger Link
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">Link Name</label>
                <Input
                  placeholder="e.g. Black Friday Promo Booking Link"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Destination Target URL</label>
                <Input
                  placeholder="https://youragency.com/offer"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Save Trigger Link
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Trigger Links List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : links.length === 0 ? (
        <Card className="bg-bg-primary border-border p-8 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto text-primary">
              <Link2 className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg">No Trigger Links Created Yet</h3>
            <p className="text-sm text-text-secondary">
              Trigger links allow you to track email/SMS click rates and automatically advance leads through your sales funnel.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {links.map((link) => {
            let data: any = {}
            try {
              data = link.description ? JSON.parse(link.description) : {}
            } catch {
              data = {}
            }
            return (
              <div key={link.id} className="p-4 rounded-xl border border-border bg-bg-primary flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-primary/40 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                    <Link2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-text-primary">{link.name}</h4>
                    <p className="text-xs text-text-secondary font-mono truncate max-w-md mt-0.5">
                      Destination: {data.targetUrl || link.description}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-text-secondary">
                      <span className="font-semibold text-primary">{data.clickCount || 0} Total Clicks</span>
                      <span>•</span>
                      <span>Triggers Lead Scoring (+20 pts)</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => copyTrackedUrl(link.id)} className="shrink-0">
                  <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Tracked Link
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {/* Starter Presets */}
      <div className="pt-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-text-primary">1-Click Starter Presets</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESET_TEMPLATES.map((preset) => (
            <div key={preset.name} className="p-4 rounded-xl border border-border bg-bg-secondary/40 flex flex-col justify-between hover:border-primary/40 transition-all">
              <div className="space-y-1">
                <h4 className="font-semibold text-xs text-text-primary">{preset.name}</h4>
                <p className="text-[11px] text-text-secondary">{preset.description}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 w-full text-xs font-semibold text-primary hover:bg-primary/10 justify-between"
                onClick={() => handleQuickCreate(preset)}
                disabled={saving}
              >
                <span>Add Preset</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
