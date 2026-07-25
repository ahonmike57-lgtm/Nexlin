"use client"

import { useState } from "react"
import { deletePlatformAdmin } from "@/app/actions/admin"
import { toast } from "sonner"
import { Trash2, Loader2, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface DeleteAdminButtonProps {
  adminId: string
  adminEmail: string
  currentAdminId?: string
}

export function DeleteAdminButton({ adminId, adminEmail, currentAdminId }: DeleteAdminButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const isSelf = currentAdminId === adminId

  if (isSelf) {
    return (
      <span className="text-xs text-text-secondary italic px-2 py-1">
        (You)
      </span>
    )
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await deletePlatformAdmin(adminId)
      if (res.success) {
        toast.success(`Revoked admin access for ${adminEmail}`)
        setOpen(false)
      } else {
        toast.error(res.error || "Failed to delete admin account")
      }
    } catch (err: any) {
      toast.error("An error occurred while deleting admin")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="p-1.5 rounded-lg text-text-secondary hover:text-error hover:bg-error/10 transition-colors"
          title="Revoke Admin Access"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[420px] bg-bg-primary text-text-primary border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-error flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-error" /> Revoke Admin Privileges?
          </DialogTitle>
          <DialogDescription className="text-sm text-text-secondary pt-1">
            Are you sure you want to delete <span className="font-semibold text-text-primary">{adminEmail}</span>? They will immediately lose God-mode access to the platform.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-error text-white hover:bg-error/90 transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Revoke Access
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
