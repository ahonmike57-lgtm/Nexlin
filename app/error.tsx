"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw, LayoutDashboard } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Unhandled Application Error caught by error boundary:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-bg-secondary flex items-center justify-center p-6 text-text-primary font-sans">
      <div className="max-w-md w-full bg-bg-primary rounded-2xl border border-border p-8 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-display tracking-tight text-text-primary">
            Temporary Session Notice
          </h2>
          <p className="text-xs text-text-secondary">
            A temporary connection or session update occurred. Click below to reload the application page smoothly.
          </p>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <Button 
            onClick={() => reset()} 
            className="bg-primary hover:bg-primary/90 text-white font-semibold gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Reload Page
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = "/dashboard"} 
            className="text-xs gap-2"
          >
            <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
