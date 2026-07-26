"use client"

import { useState } from "react"
import { createMarketplaceApp } from "@/app/actions/apps"
import { toast } from "sonner"
import { Plus, AppWindow, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function CreateAppDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("CRM")
  const [author, setAuthor] = useState("")
  const [icon, setIcon] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const res = await createMarketplaceApp({
      name,
      description,
      category,
      icon,
      installType: "oauth"
    })

    if (res.success) {
      toast.success("New Marketplace App registered successfully!")
      setOpen(false)
      setName("")
      setDescription("")
      setAuthor("")
      setIcon("")
    } else {
      toast.error(res.error || "Failed to register app")
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Register Marketplace App
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] bg-bg-primary text-text-primary border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AppWindow className="w-5 h-5 text-primary" /> Register New Marketplace App
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">App Name</label>
            <Input
              placeholder="e.g. WhatsApp Inbox Engine"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Description</label>
            <textarea
              rows={3}
              placeholder="Brief description of what this integration or tool does..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 text-sm bg-bg-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary"
            >
              <option value="CRM">CRM & Contacts</option>
              <option value="Communication">Communication & Telephony</option>
              <option value="AI">AI & Voice Agents</option>
              <option value="Billing">Payments & Billing</option>
              <option value="Automation">Workflows & Automation</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Developer / Author Name</label>
            <Input
              placeholder="e.g. Acme Dev Team"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Icon Image URL (Optional)</label>
            <Input
              placeholder="https://example.com/icon.png"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Register & Publish App
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
