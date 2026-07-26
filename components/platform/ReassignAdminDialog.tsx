"use client"

import { useState } from "react"
import { reassignTenantAdmin } from "@/app/actions/tenants"
import { toast } from "sonner"
import { UserCheck, ShieldAlert, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function ReassignAdminDialog({ agencyId, tenantName }: { agencyId: string; tenantName: string }) {
  const [open, setOpen] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState("")
  const [newAdminName, setNewAdminName] = useState("")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const res = await reassignTenantAdmin({
      agencyId,
      newAdminEmail,
      newAdminName,
      reason,
    })

    if (res.success) {
      toast.success("Break-glass admin reassignment completed and logged!")
      setOpen(false)
      setNewAdminEmail("")
      setNewAdminName("")
      setReason("")
    } else {
      toast.error(res.error || "Failed to reassign admin")
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="px-2 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors flex items-center gap-1"
          title="Break-Glass Admin Reassignment"
        >
          <ShieldAlert className="w-3 h-3 text-amber-600" />
          Reassign Admin
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] bg-bg-primary text-text-primary border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <ShieldAlert className="w-5 h-5 text-amber-600" /> Break-Glass Admin Reassignment
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-800 space-y-1">
            <div className="font-bold">⚠️ High-Privilege Break-Glass Action</div>
            <div>
              Reassigning primary admin ownership for <span className="font-bold">{tenantName}</span> will be permanently logged in the audit trail.
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">New Owner Email</label>
            <Input
              type="email"
              placeholder="newowner@tenant.com"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">New Owner Full Name</label>
            <Input
              placeholder="Jane Doe"
              value={newAdminName}
              onChange={(e) => setNewAdminName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Justification / Reason (Audit Logged)</label>
            <textarea
              rows={2}
              placeholder="e.g. Previous admin departed company; approved by Platform Owner"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 text-xs bg-bg-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Confirm Reassignment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
