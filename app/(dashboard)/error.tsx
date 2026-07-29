"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw, LayoutDashboard } from "lucide-react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard route error boundary:", error)
  }, [error])

  return (
    <div className="h-full flex items-center justify-center p-6 bg-bg-secondary text-text-primary">
      <div className="max-w-md w-full bg-bg-primary rounded-2xl border border-border p-8 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 text-primary flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold font-display tracking-tight text-text-primary">
            NEXLIN Dashboard Notice
          </h2>
          <p className="text-xs text-text-secondary">
            Your session updated smoothly. Click reload to refresh this workspace module.
          </p>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <Button 
            onClick={() => reset()} 
            className="bg-primary hover:bg-primary/90 text-white font-semibold gap-2 text-xs"
          >
            <RefreshCw className="w-4 h-4" /> Reload Page
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = "/dashboard"} 
            className="text-xs gap-2"
          >
            <LayoutDashboard className="w-4 h-4" /> Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
