"use client"

import { useState, useEffect } from "react"
import { getTriggerLinks, createTriggerLink } from "@/app/actions/trigger-links"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link2, Plus, Copy, ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

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

  const copyTrackedUrl = (linkId: string) => {
    const fullUrl = `${window.location.origin}/api/t/${linkId}`
    navigator.clipboard.writeText(fullUrl)
    toast.success("Tracked URL copied to clipboard!")
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
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

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : links.length === 0 ? (
        <Card className="bg-bg-primary border-border text-center py-8">
          <CardContent className="space-y-2">
            <Link2 className="w-8 h-8 text-text-secondary mx-auto" />
            <h3 className="font-semibold text-base">No Trigger Links Created</h3>
            <p className="text-xs text-text-secondary">Click "Create Trigger Link" to set up tracked action links.</p>
          </CardContent>
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
              <div key={link.id} className="p-4 rounded-xl border border-border bg-bg-primary flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Link2 className="w-5 h-5 text-primary" />
                  <div>
                    <h4 className="font-medium text-sm text-text-primary">{link.name}</h4>
                    <p className="text-xs text-text-secondary font-mono truncate max-w-md">Target: {data.targetUrl}</p>
                    <span className="text-[11px] text-text-secondary mt-1 block">Clicks: {data.clickCount || 0}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => copyTrackedUrl(link.id)}>
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copy Tracked Link
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
