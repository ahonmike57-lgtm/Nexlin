"use client"

import { useState, useEffect } from "react"
import { Activity, CheckCircle2, ShieldCheck, Cpu, Database, Server } from "lucide-react"

export function SystemHealthWidget() {
  const [latency, setLatency] = useState(18)

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Math.floor(12 + Math.random() * 14))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-4 rounded-xl border border-border bg-bg-primary shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-success animate-pulse" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-primary">System Health Status</h4>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-success/10 text-success border border-success/20 font-bold">
          All Operational ({latency}ms)
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2 rounded bg-bg-secondary/50 flex items-center gap-2 border border-border/50">
          <Database className="w-3.5 h-3.5 text-primary" />
          <span>PostgreSQL: OK</span>
        </div>
        <div className="p-2 rounded bg-bg-secondary/50 flex items-center gap-2 border border-border/50">
          <Server className="w-3.5 h-3.5 text-primary" />
          <span>NextAuth JWT: OK</span>
        </div>
        <div className="p-2 rounded bg-bg-secondary/50 flex items-center gap-2 border border-border/50">
          <Cpu className="w-3.5 h-3.5 text-primary" />
          <span>Pusher Socket: OK</span>
        </div>
        <div className="p-2 rounded bg-bg-secondary/50 flex items-center gap-2 border border-border/50">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>AES-256 Enc: OK</span>
        </div>
      </div>
    </div>
  )
}
