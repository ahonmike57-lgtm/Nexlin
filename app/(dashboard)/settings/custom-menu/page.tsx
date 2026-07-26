"use client"

import { useState, useEffect } from "react"
import { getCustomMenuItems, createCustomMenuItem } from "@/app/actions/custom-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Link as LinkIcon, Plus, ExternalLink, Globe, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function CustomMenuSettingsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [label, setLabel] = useState("")
  const [iframeUrl, setIframeUrl] = useState("")

  const loadItems = async () => {
    setLoading(true)
    const res = await getCustomMenuItems()
    if (res.success && res.items) {
      setItems(res.items)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadItems()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!label || !iframeUrl) return

    setSaving(true)
    const res = await createCustomMenuItem(label, iframeUrl)
    if (res.success) {
      toast.success("Custom menu link added!")
      setOpen(false)
      setLabel("")
      setIframeUrl("")
      loadItems()
    } else {
      toast.error(res.error || "Failed to add menu link")
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Custom Menu iFrames</h2>
          <p className="text-text-secondary">Add custom left-navigation links that embed third-party web tools inside full-height iFrames.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Custom Link
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px] bg-bg-primary border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" /> New Custom Sidebar Link
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">Navigation Label</label>
                <Input
                  placeholder="e.g. Agency Portal / Support Desk"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Target iFrame URL</label>
                <Input
                  placeholder="https://example.com/app"
                  value={iframeUrl}
                  onChange={(e) => setIframeUrl(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Save Menu Link
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
      ) : items.length === 0 ? (
        <Card className="bg-bg-primary border-border text-center py-8">
          <CardContent className="space-y-2">
            <LinkIcon className="w-8 h-8 text-text-secondary mx-auto" />
            <h3 className="font-semibold text-base">No Custom Menu Links Added</h3>
            <p className="text-xs text-text-secondary">Click "Add Custom Link" to embed external tools into your sidebar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="p-4 rounded-xl border border-border bg-bg-primary flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-primary" />
                <div>
                  <h4 className="font-medium text-sm text-text-primary">{item.name}</h4>
                  <p className="text-xs text-text-secondary font-mono truncate max-w-md">{item.iframeUrl}</p>
                </div>
              </div>
              <a href={item.iframeUrl} target="_blank" rel="noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
                Test Link <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
