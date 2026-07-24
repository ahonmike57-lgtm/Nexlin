"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Webhook as WebhookIcon, Trash2 } from "lucide-react"
import { createWebhook, deleteWebhook } from "@/app/actions/webhooks"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"

export default function WebhooksClient({ initialWebhooks, agencyId }: { initialWebhooks: any[], agencyId: string }) {
  const [webhooks, setWebhooks] = useState(initialWebhooks)
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [event, setEvent] = useState("contact.created")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreate = async () => {
    if (!name || !url || !event) {
      toast.error("Please fill all fields")
      return
    }

    setIsSubmitting(true)
    const res = await createWebhook(agencyId, { name, url, event })
    setIsSubmitting(false)

    if (res.success && res.webhook) {
      toast.success("Webhook created!")
      setWebhooks([res.webhook, ...webhooks])
      setIsOpen(false)
      setName("")
      setUrl("")
      setEvent("contact.created")
    } else {
      toast.error(res.error || "Failed to create webhook")
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this webhook?")) {
      const res = await deleteWebhook(id, agencyId)
      if (res.success) {
        toast.success("Webhook deleted")
        setWebhooks(webhooks.filter(w => w.id !== id))
      } else {
        toast.error("Failed to delete webhook")
      }
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Webhooks</h2>
          <p className="text-text-secondary">Send data to external applications when events happen in Nexlin.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4"/> Add Webhook</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Webhook</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Zapier Lead Sync" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Endpoint URL</label>
                <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://hooks.zapier.com/..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Event</label>
                <Select value={event} onValueChange={setEvent}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contact.created">Contact Created</SelectItem>
                    <SelectItem value="deal.won">Deal Won</SelectItem>
                    <SelectItem value="form.submitted">Form Submitted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Creating..." : "Save Webhook"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3 mt-6">
        {webhooks.length === 0 ? (
          <div className="p-8 text-center border border-dashed rounded-lg text-text-secondary">
            <WebhookIcon className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p>No webhooks configured yet.</p>
          </div>
        ) : (
          webhooks.map(wh => (
            <div key={wh.id} className="p-4 border rounded-lg bg-bg-secondary flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">{wh.name}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {wh.event}
                  </span>
                </div>
                <p className="text-xs text-text-secondary font-mono">{wh.url}</p>
              </div>
              <div className="flex items-center gap-4">
                <Switch checked={wh.isActive} disabled />
                <Button variant="ghost" size="icon" onClick={() => handleDelete(wh.id)} className="text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
