"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { getAgencySettings, updateAgencyProfile } from "@/app/actions/settings"
import { toast } from "sonner"
import { Loader2, Building2, Globe, PhoneCall, Sparkles, ShieldCheck, Clock, DollarSign, Save } from "lucide-react"

export default function GeneralSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Agency Profile fields
  const [name, setName] = useState("")
  const [whiteLabelName, setWhiteLabelName] = useState("")
  const [subdomain, setSubdomain] = useState("")
  const [customDomain, setCustomDomain] = useState("")
  const [planTier, setPlanTier] = useState("basic")
  const [timezone, setTimezone] = useState("America/New_York")
  const [currency, setCurrency] = useState("USD")

  // Missed Call TextBack fields
  const [missedCallEnabled, setMissedCallEnabled] = useState(false)
  const [missedCallMessage, setMissedCallMessage] = useState("Hi, this is [Agency Name]. We missed your call, how can we help?")

  useEffect(() => {
    getAgencySettings().then((res) => {
      if (res.success && res.agency) {
        setName(res.agency.name || "")
        setWhiteLabelName(res.agency.whiteLabelName || "")
        setSubdomain(res.agency.subdomain || "")
        setCustomDomain(res.agency.customDomain || "")
        setPlanTier(res.agency.planTier || "basic")
        setMissedCallEnabled(res.agency.missedCallEnabled || false)
        setMissedCallMessage(res.agency.missedCallMessage || "Hi, this is [Agency Name]. We missed your call, how can we help?")
      }
      setLoading(false)
    })
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    const result = await updateAgencyProfile({
      name,
      whiteLabelName,
      subdomain,
      customDomain,
      missedCallEnabled,
      missedCallMessage
    })

    setSaving(false)
    if (result.success) {
      toast.success("Agency profile & general settings saved successfully!")
    } else {
      toast.error(result.error || "Failed to save settings")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-semibold mb-1">General Settings</h2>
        <p className="text-text-secondary">Manage your core agency profile, regional defaults, and automated telephony.</p>
      </div>

      {/* 1. Agency Business Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" /> Agency Business Profile
              </CardTitle>
              <CardDescription>The core identity for your agency dashboard and client portals.</CardDescription>
            </div>
            <Badge variant="outline" className="uppercase font-bold text-xs px-2.5 py-0.5 border-primary/40 text-primary">
              {planTier} Tier
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-primary">Agency Company Name</label>
              <Input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Marketing Agency"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-primary">White-Label Brand Display Name</label>
              <Input 
                value={whiteLabelName}
                onChange={(e) => setWhiteLabelName(e.target.value)}
                placeholder="e.g. Nexlin Growth Platform"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-primary">Workspace Subdomain</label>
              <div className="flex items-center">
                <Input 
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  placeholder="acme"
                  className="rounded-r-none"
                  required
                />
                <span className="bg-bg-secondary border border-l-0 border-border px-3 py-2 text-xs text-text-secondary rounded-r-md">
                  .nexlin.com
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-primary">Custom Root Domain (Optional)</label>
              <Input 
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="app.myagency.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Regional & Localization Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-5 h-5 text-primary" /> Regional & Currency Preferences
          </CardTitle>
          <CardDescription>Default calendar timezones and billing currencies for client invoices.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-primary">Default Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="America/New_York">Eastern Time (US & Canada) - EST</option>
                <option value="America/Chicago">Central Time (US & Canada) - CST</option>
                <option value="America/Denver">Mountain Time (US & Canada) - MST</option>
                <option value="America/Los_Angeles">Pacific Time (US & Canada) - PST</option>
                <option value="Europe/London">London (GMT / BST)</option>
                <option value="Europe/Paris">Paris, Berlin, Amsterdam (CET)</option>
                <option value="Africa/Lagos">West Africa Time (WAT) - Lagos</option>
                <option value="Asia/Dubai">Gulf Standard Time (GST) - Dubai</option>
                <option value="Asia/Singapore">Singapore Time (SGT)</option>
                <option value="UTC">Coordinated Universal Time (UTC)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-primary">Default Invoice Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="USD">USD ($) - United States Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="NGN">NGN (₦) - Nigerian Naira</option>
                <option value="CAD">CAD ($) - Canadian Dollar</option>
                <option value="AUD">AUD ($) - Australian Dollar</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Missed Call Text Back Automation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <PhoneCall className="w-5 h-5 text-primary" /> Missed Call Text Back
              </CardTitle>
              <CardDescription>Automatically send a customized SMS when you or a staff member misses an incoming call.</CardDescription>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={missedCallEnabled}
                onChange={(e) => setMissedCallEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </CardHeader>
        {missedCallEnabled && (
          <CardContent className="space-y-3 pt-0">
            <label className="text-xs font-semibold text-text-primary">Automated Response Message</label>
            <textarea
              className="w-full min-h-[90px] rounded-md border border-border bg-bg-primary p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={missedCallMessage}
              onChange={(e) => setMissedCallMessage(e.target.value)}
              placeholder="Hi, this is [Agency Name]. We missed your call, how can we help?"
            />
            <p className="text-[11px] text-text-secondary">
              Use merge tags like <code>[Agency Name]</code> and <code>[Contact Name]</code> to personalize the SMS.
            </p>
          </CardContent>
        )}
      </Card>

      {/* Form Submit Footer */}
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={saving} className="flex items-center gap-2 px-6">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save General Settings
        </Button>
      </div>
    </form>
  )
}
