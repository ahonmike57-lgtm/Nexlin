"use client"

import { useSession } from "next-auth/react"
import { stopImpersonation } from "@/app/actions/impersonate"
import { ShieldAlert, LogOut, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function ImpersonationBanner() {
  const { data: session, update } = useSession()
  const [loading, setLoading] = useState(false)

  const isImpersonating = (session?.user as any)?.isImpersonating

  if (!isImpersonating) return null

  const handleStop = async () => {
    setLoading(true)
    try {
      const res = await stopImpersonation()
      if (res.success) {
        await update({ impersonateAgencyId: null })
        toast.success("Impersonation session ended")
        window.location.href = "/platform"
      } else {
        toast.error(res.error || "Failed to stop impersonation")
      }
    } catch (e: any) {
      toast.error("Error stopping impersonation")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-amber-600 text-white px-4 py-2 flex items-center justify-between text-xs font-semibold z-[100] relative shadow-md">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 animate-pulse" />
        <span>IMPERSONATION MODE ACTIVE: You are currently viewing & debugging a tenant agency account.</span>
      </div>

      <button
        onClick={handleStop}
        disabled={loading}
        className="px-3 py-1 bg-white text-amber-800 hover:bg-amber-100 rounded text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogOut className="w-3 h-3" />}
        Exit Impersonation Mode
      </button>
    </div>
  )
}
