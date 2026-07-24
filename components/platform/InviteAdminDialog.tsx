"use client"

import { useState } from "react"
import { invitePlatformAdmin } from "@/app/actions/admin"
import { toast } from "sonner"
import { UserPlus, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface InviteAdminDialogProps {
  isOwner: boolean
}

export function InviteAdminDialog({ isOwner }: InviteAdminDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("developer")

  if (!isOwner) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error("Please enter an email address")
      return
    }

    setLoading(true)
    try {
      const res = await invitePlatformAdmin({ name, email, role })
      if (res.success) {
        toast.success(`Admin invited successfully! Initial password: ${res.data?.defaultPassword}`)
        setName("")
        setEmail("")
        setRole("developer")
        setOpen(false)
      } else {
        toast.error(res.error || "Failed to invite admin")
      }
    } catch (err: any) {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary bg-primary text-white shadow-sm hover:bg-primary/90 h-10 px-4 py-2">
          <UserPlus className="w-4 h-4" />
          Invite Admin
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] bg-bg-primary text-text-primary border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-text-primary">Invite Platform Administrator</DialogTitle>
          <DialogDescription className="text-sm text-text-secondary">
            Grant admin credentials to a team member to manage the Nexlin ecosystem.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Sarah Jenkins"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Email Address <span className="text-error">*</span></label>
            <input
              type="email"
              required
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Platform Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="developer">Developer</option>
              <option value="owner">Owner (Full Access)</option>
              <option value="support">Support Agent</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Send Invitation
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
