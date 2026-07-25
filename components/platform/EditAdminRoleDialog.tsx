"use client"

import { useState } from "react"
import { updatePlatformAdminRole, togglePlatformAdminStatus } from "@/app/actions/admin"
import { toast } from "sonner"
import { Settings, Shield, UserX, UserCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface EditAdminRoleDialogProps {
  adminId: string
  adminName: string
  adminEmail: string
  currentRole: string
  currentStatus: string
  isSelf: boolean
}

export function EditAdminRoleDialog({
  adminId,
  adminName,
  adminEmail,
  currentRole,
  currentStatus,
  isSelf
}: EditAdminRoleDialogProps) {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState(currentRole)
  const [status, setStatus] = useState(currentStatus || "active")
  const [loading, setLoading] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    let roleChanged = false
    let statusChanged = false

    if (role !== currentRole) {
      const resRole = await updatePlatformAdminRole(adminId, role)
      if (resRole.success) {
        roleChanged = true
      } else {
        toast.error(resRole.error || "Failed to update role")
      }
    }

    if (status !== currentStatus && !isSelf) {
      const resStatus = await togglePlatformAdminStatus(adminId, status as any)
      if (resStatus.success) {
        statusChanged = true
      } else {
        toast.error(resStatus.error || "Failed to update status")
      }
    }

    if (roleChanged || statusChanged) {
      toast.success("Admin settings updated successfully")
      setOpen(false)
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="p-1 text-text-secondary hover:text-text-primary rounded-md transition-colors"
          title="Edit Admin Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-bg-primary text-text-primary border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Edit Administrator Settings
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-secondary">Administrator</label>
            <div className="font-semibold text-sm">{adminName || adminEmail}</div>
            <div className="text-xs text-text-secondary">{adminEmail}</div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Platform Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isSelf}
              className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary disabled:opacity-50"
            >
              <option value="owner">Owner (Full Mutation & System Access)</option>
              <option value="developer">Developer (Diagnostics, Logs & Read Cross-Tenant)</option>
              <option value="support">Support (Tenant Inspection & Impersonation)</option>
            </select>
          </div>

          {!isSelf && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Account Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary"
              >
                <option value="active">Active (Access Granted)</option>
                <option value="suspended">Suspended (Access Instantly Blocked)</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
