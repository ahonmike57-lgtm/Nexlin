"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { createDeal } from "@/app/actions/deals"

export default function AddDealModal({ contacts = [] }: { contacts?: any[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get("title") as string,
      value: parseFloat(formData.get("value") as string) || 0,
      stage: formData.get("stage") as string || "lead",
      contactId: formData.get("contactId") as string || undefined,
    }
    
    const response = await createDeal(data)
    
    setLoading(false)
    if (response.success) {
      setOpen(false)
    } else {
      alert("Failed to create deal")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="w-4 h-4 mr-2" /> New Deal</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create new deal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Deal Title</label>
            <Input name="title" required placeholder="Website Redesign" />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Deal Value ($)</label>
            <Input name="value" type="number" required placeholder="5000" />
          </div>

          <div className="space-y-2 flex flex-col">
            <label className="text-sm font-medium">Stage</label>
            <select name="stage" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <option value="lead">New Lead</option>
                <option value="contacted">Contacted</option>
                <option value="meeting">Meeting Scheduled</option>
                <option value="proposal">Proposal Sent</option>
                <option value="won">Closed Won</option>
            </select>
          </div>

          {contacts && contacts.length > 0 && (
            <div className="space-y-2 flex flex-col">
              <label className="text-sm font-medium">Link Contact (Optional)</label>
              <select name="contactId" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="">-- No Contact --</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                  ))}
              </select>
            </div>
          )}
          
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Create Deal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
