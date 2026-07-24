"use client"

import { useState } from "react"
import { updateFeatureFlag } from "@/app/actions/feature-flags"
import { toast } from "sonner"
import { Sliders, ShieldCheck, ShieldAlert, Sparkles, Layers } from "lucide-react"

interface FeatureFlagItem {
  id: string
  key: string
  name: string
  description: string | null
  enabledTiers: string
  isEnabledGlobal: boolean
}

export default function FeatureFlagsClient({ initialFlags }: { initialFlags: FeatureFlagItem[] }) {
  const [flags, setFlags] = useState<FeatureFlagItem[]>(initialFlags)
  const [updatingKey, setUpdatingKey] = useState<string | null>(null)

  const handleToggleGlobal = async (key: string, currentVal: boolean) => {
    setUpdatingKey(key)
    const newVal = !currentVal

    const res = await updateFeatureFlag({ key, isEnabledGlobal: newVal })
    if (res.success && res.flag) {
      setFlags(flags.map(f => f.key === key ? { ...f, isEnabledGlobal: res.flag!.isEnabledGlobal } : f))
      toast.success(`${res.flag.name} global status set to ${newVal ? 'Active' : 'Disabled'}`)
    } else {
      toast.error(res.error || "Failed to update feature flag")
    }
    setUpdatingKey(null)
  }

  const handleToggleTier = async (key: string, currentTiersStr: string, tier: string) => {
    setUpdatingKey(key)
    let currentTiers = currentTiersStr ? currentTiersStr.split(",").map(t => t.trim()) : []
    
    if (currentTiers.includes(tier)) {
      currentTiers = currentTiers.filter(t => t !== tier)
    } else {
      currentTiers.push(tier)
    }

    const newTiersStr = currentTiers.join(",")
    const res = await updateFeatureFlag({ key, enabledTiers: newTiersStr })

    if (res.success && res.flag) {
      setFlags(flags.map(f => f.key === key ? { ...f, enabledTiers: res.flag!.enabledTiers } : f))
      toast.success(`Updated tier access for ${res.flag.name}`)
    } else {
      toast.error(res.error || "Failed to update tier access")
    }
    setUpdatingKey(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Feature Flags & Tier Access</h1>
          <p className="text-text-secondary">
            Globally enable/disable platform modules and control tier access for agencies.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          <Sparkles className="w-4 h-4" /> Real-time Control
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {flags.map((flag) => {
          const tiers = flag.enabledTiers ? flag.enabledTiers.split(",").map(t => t.trim()) : []
          const isBusy = updatingKey === flag.key

          return (
            <div 
              key={flag.key}
              className={`rounded-xl border p-6 bg-bg-primary shadow-sm transition-all ${
                flag.isEnabledGlobal ? 'border-border' : 'border-border opacity-70 bg-bg-secondary/40'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 max-w-lg">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-text-primary">{flag.name}</h3>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                      flag.isEnabledGlobal 
                        ? 'bg-success/10 text-success border-success/20' 
                        : 'bg-error/10 text-error border-error/20'
                    }`}>
                      {flag.isEnabledGlobal ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                      {flag.isEnabledGlobal ? "Enabled Globally" : "Disabled Globally"}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">{flag.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  {/* Tier Access Toggles */}
                  <div className="flex items-center gap-3 bg-bg-secondary p-2.5 rounded-lg border border-border">
                    <span className="text-xs font-medium text-text-secondary flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" /> Allowed Tiers:
                    </span>
                    {["basic", "pro", "enterprise"].map((tier) => {
                      const isAllowed = tiers.includes(tier)
                      return (
                        <label 
                          key={tier} 
                          className={`inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer px-2.5 py-1 rounded-md transition-colors ${
                            isAllowed 
                              ? 'bg-primary text-white font-semibold shadow-xs' 
                              : 'text-text-secondary hover:bg-bg-primary'
                          }`}
                        >
                          <input 
                            type="checkbox"
                            className="sr-only"
                            checked={isAllowed}
                            disabled={isBusy || !flag.isEnabledGlobal}
                            onChange={() => handleToggleTier(flag.key, flag.enabledTiers, tier)}
                          />
                          <span className="capitalize">{tier}</span>
                        </label>
                      )
                    })}
                  </div>

                  {/* Master Switch */}
                  <button
                    onClick={() => handleToggleGlobal(flag.key, flag.isEnabledGlobal)}
                    disabled={isBusy}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      flag.isEnabledGlobal ? 'bg-primary' : 'bg-border'
                    } ${isBusy ? 'opacity-50' : ''}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        flag.isEnabledGlobal ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
