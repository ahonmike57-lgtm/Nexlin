"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog"
import {
  Sparkles,
  Zap,
  Building2,
  Home,
  Laptop,
  Hammer,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  Loader2
} from "lucide-react"
import {
  seedDemoAgencyData,
  resetDemoAgencyData,
  getDemoSeedStatus,
  type DemoPresetKey
} from "@/app/actions/demo-seed"
import { toast } from "sonner"

const PRESETS: Array<{
  id: DemoPresetKey
  title: string
  subtitle: string
  dealsValue: string
  icon: any
  badge: string
  color: string
}> = [
  {
    id: "dental",
    title: "Dental & Aesthetic MedSpa",
    subtitle: "High-ticket All-On-4 implant restoration, porcelain veneers & smile assessments",
    dealsValue: "$50,050 active pipeline",
    icon: Sparkles,
    badge: "Healthcare & Aesthetics",
    color: "from-blue-600 to-cyan-600"
  },
  {
    id: "real_estate",
    title: "Luxury Real Estate & Acquisitions",
    subtitle: "Waterfront estates, TriBeCa penthouses, all-cash offer rooms & proof of funds",
    dealsValue: "$11.75M active pipeline",
    icon: Home,
    badge: "High-Ticket Real Estate",
    color: "from-purple-600 to-indigo-600"
  },
  {
    id: "b2b_saas",
    title: "B2B SaaS & Growth Agency",
    subtitle: "Inbound MQLs, annual CPQ retainers, AI SDR 30-sec follow-ups & contracts",
    dealsValue: "$170,500 active pipeline",
    icon: Laptop,
    badge: "Enterprise SaaS & Agency",
    color: "from-emerald-600 to-teal-600"
  },
  {
    id: "home_services",
    title: "Roofing, Solar & Home Services",
    subtitle: "Emergency storm damage, drone thermal inspections & insurance scopes",
    dealsValue: "$204,000 active pipeline",
    icon: Hammer,
    badge: "Contracting & Trades",
    color: "from-amber-600 to-orange-600"
  }
]

export default function DemoAcceleratorBanner() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activePreset, setActivePreset] = useState<DemoPresetKey | null>(null)
  const [hasDemoData, setHasDemoData] = useState(false)
  const [contactCount, setContactCount] = useState(0)

  const checkStatus = async () => {
    const res = await getDemoSeedStatus()
    if (res.success) {
      setHasDemoData(res.hasDemoData)
      setContactCount(res.demoContactCount)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  const handleSeed = async (presetKey: DemoPresetKey) => {
    setLoading(true)
    setActivePreset(presetKey)
    const res = await seedDemoAgencyData(presetKey)
    setLoading(false)

    if (res.success && res.stats) {
      toast.success(
        `Loaded ${res.presetName}! Created ${res.stats.deals} deals, ${res.stats.contacts} contacts & ${res.stats.appointments} appointments.`
      )
      setIsOpen(false)
      checkStatus()
    } else {
      toast.error(res.error || "Failed to load demo preset")
    }
  }

  const handleReset = async () => {
    setLoading(true)
    const res = await resetDemoAgencyData()
    setLoading(false)

    if (res.success) {
      toast.success("Demo accelerator data removed. Your CRM is clean!")
      setIsOpen(false)
      checkStatus()
    } else {
      toast.error(res.error || "Failed to reset demo data")
    }
  }

  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-blue-500/10 to-indigo-500/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm backdrop-blur-md">
      <div className="flex items-start sm:items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 shadow-inner">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm text-text-primary">1-Click Agency Accelerator</h4>
            {hasDemoData ? (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                Demo Active ({contactCount} records)
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                Ready to Seed
              </Badge>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Instantly populate realistic multi-stage deals, contacts, calendar slots, and omnichannel conversations for live client demonstrations.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
        {hasDemoData && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={loading}
            className="text-xs text-text-secondary hover:text-error hover:bg-error/10 h-9"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset Demo Data
          </Button>
        )}

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="font-semibold text-xs h-9 px-4 shadow-md shadow-primary/25 whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              {hasDemoData ? "Switch Industry Preset" : "Load Demo Preset"}
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[720px] bg-bg-card border-border p-6 rounded-3xl">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Select Industry Demo Preset
              </DialogTitle>
              <DialogDescription className="text-xs text-text-secondary">
                Choose an industry niche. Nexlin will generate customized pipelines, high-value deals, AI transcripts, and appointments in 2 seconds.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-3">
              {PRESETS.map((p) => {
                const Icon = p.icon
                const isSelected = activePreset === p.id && loading

                return (
                  <button
                    key={p.id}
                    onClick={() => handleSeed(p.id)}
                    disabled={loading}
                    className="group p-4 rounded-2xl border border-border/80 bg-bg-secondary/40 hover:bg-bg-secondary hover:border-primary/50 text-left transition-all duration-200 flex flex-col justify-between space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${p.color} flex items-center justify-center text-white shadow-md`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <Badge variant="outline" className="text-[10px] text-text-muted border-border font-medium">
                        {p.badge}
                      </Badge>
                    </div>

                    <div>
                      <h5 className="font-bold text-sm text-text-primary group-hover:text-primary transition-colors">
                        {p.title}
                      </h5>
                      <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">
                        {p.subtitle}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] w-full text-text-muted">
                      <span className="font-semibold text-emerald-400">{p.dealsValue}</span>
                      <span className="text-primary font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        {isSelected ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>Load <ArrowRight className="w-3 h-3" /></>}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {hasDemoData && (
              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-text-muted">
                <span>Demo records are isolated with &quot;demo-accelerator&quot; tags.</span>
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="text-error hover:underline flex items-center gap-1 font-medium"
                >
                  <RotateCcw className="w-3 h-3" />
                  Wipe Demo Records
                </button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
