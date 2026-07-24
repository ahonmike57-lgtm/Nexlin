"use client"

import { useState } from "react"
import { invitePlatformAdmin } from "@/app/actions/admin"
import { toast } from "sonner"
import { UserPlus, Loader2, Copy, Check, KeyRound, ExternalLink } from "lucide-react"
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

  // Result state after generating invite
  const [createdInvite, setCreatedInvite] = useState<{
    email: string
    inviteCode: string
    acceptUrl: string
  } | null>(null)

  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

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
      if (res.success && res.data) {
        toast.success(`Admin invitation generated for ${res.data.email}`)
        setCreatedInvite({
          email: res.data.email,
          inviteCode: res.data.inviteCode,
          acceptUrl: `${window.location.origin}${res.data.acceptUrl}`
        })
      } else {
        toast.error(res.error || "Failed to invite admin")
      }
    } catch (err: any) {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setName("")
    setEmail("")
    setRole("developer")
    setCreatedInvite(null)
    setCopiedCode(false)
    setCopiedLink(false)
    setOpen(false)
  }

  const copyToClipboard = (text: string, type: "code" | "link") => {
    navigator.clipboard.writeText(text)
    if (type === "code") {
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } else {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
    toast.success("Copied to clipboard!")
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val)
      if (!val) handleReset()
    }}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary bg-primary text-white shadow-sm hover:bg-primary/90 h-10 px-4 py-2">
          <UserPlus className="w-4 h-4" />
          Invite Admin
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px] bg-bg-primary text-text-primary border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-text-primary">
            {createdInvite ? "Invitation Generated!" : "Invite Platform Administrator"}
          </DialogTitle>
          <DialogDescription className="text-sm text-text-secondary">
            {createdInvite 
              ? "Share the 6-digit verification code or direct signup link with the invited admin." 
              : "Generate an admin invitation. The user will receive a verification code to complete sign-up."
            }
          </DialogDescription>
        </DialogHeader>

        {createdInvite ? (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-bg-secondary border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Invited Email</span>
                <span className="text-sm font-medium text-text-primary">{createdInvite.email}</span>
              </div>

              <div className="pt-2 border-t border-border">
                <div className="text-xs font-semibold text-text-secondary mb-1 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-primary" /> 6-Digit Verification Code
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-primary border border-border">
                  <span className="text-2xl font-mono font-bold tracking-widest text-primary">
                    {createdInvite.inviteCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdInvite.inviteCode, "code")}
                    className="p-2 rounded-md hover:bg-bg-secondary text-text-secondary hover:text-text-primary transition-colors"
                    title="Copy Code"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <div className="text-xs font-semibold text-text-secondary mb-1 flex items-center gap-1">
                  <ExternalLink className="w-3.5 h-3.5 text-primary" /> Direct Signup Link
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-bg-primary border border-border gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createdInvite.acceptUrl}
                    className="text-xs bg-transparent text-text-secondary w-full focus:outline-none font-mono truncate"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdInvite.acceptUrl, "link")}
                    className="p-1.5 rounded-md hover:bg-bg-secondary text-text-secondary hover:text-text-primary transition-colors shrink-0"
                    title="Copy Link"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors w-full"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">Full Name (Optional)</label>
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
                onClick={handleReset}
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
                Generate Invitation
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
