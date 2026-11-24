"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { getAgencySettings, updateAgencyProfile, exportAgencyData } from "@/app/actions/settings"
import { toast } from "sonner"
import {
  Loader2,
  Building2,
  Globe,
  PhoneCall,
  Clock,
  Save,
  Copy,
  ExternalLink,
  Check,
  Upload,
  Download,
  Smartphone,
  Sparkles,
  FileDown
} from "lucide-react"

export default function GeneralSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Agency Profile fields
  const [name, setName] = useState("")
  const [whiteLabelName, setWhiteLabelName] = useState("")
  const [subdomain, setSubdomain] = useState("")
  const [customDomain, setCustomDomain] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [planTier, setPlanTier] = useState("basic")
  const [timezone, setTimezone] = useState("America/New_York")
  const [currency, setCurrency] = useState("USD")

  // Missed Call TextBack fields
  const [missedCallEnabled, setMissedCallEnabled] = useState(false)
  const [missedCallMessage, setMissedCallMessage] = useState(
    "Hi, this is [Agency Name]. We missed your call, how can we help?"
  )

  const logoInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    getAgencySettings().then((res) => {
      if (res.success && res.agency) {
        setName(res.agency.name || "")
        setWhiteLabelName(res.agency.whiteLabelName || "")
        setSubdomain(res.agency.subdomain || "")
        setCustomDomain(res.agency.customDomain || "")
        setLogoUrl(res.agency.logoUrl || "")
        setPlanTier(res.agency.planTier || "basic")
        setTimezone((res.agency as any).timezone || "America/New_York")
        setCurrency((res.agency as any).currency || "USD")
        setMissedCallEnabled(res.agency.missedCallEnabled || false)
        setMissedCallMessage(
          res.agency.missedCallMessage || "Hi, this is [Agency Name]. We missed your call, how can we help?"
        )
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
      logoUrl,
      timezone,
      currency,
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "branding")

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData
      })
      const data = await res.json()

      if (data.success && data.url) {
        setLogoUrl(data.url)
        toast.success("Logo uploaded! Click 'Save General Settings' to persist.")
      } else {
        toast.error(data.error || "Failed to upload logo")
      }
    } catch {
      toast.error("Error uploading logo image")
    } finally {
      setUploadingLogo(false)
    }
  }

  const getPortalUrl = () => {
    const cleanCustom = customDomain.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "")
    if (cleanCustom) {
      return `https://${cleanCustom}`
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "https://nexlin-virid.vercel.app"
    return `${origin}/f/${subdomain || "app"}`
  }

  const portalUrl = getPortalUrl()

  const handleCopySubdomain = () => {
    navigator.clipboard.writeText(portalUrl)
    setCopiedLink(true)
    toast.success("Portal URL copied to clipboard!")
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleExportData = async () => {
    setExporting(true)
    try {
      const res = await exportAgencyData()
      if (res.success && res.data) {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(res.data, null, 2)
        )}`
        const downloadAnchor = document.createElement("a")
        downloadAnchor.setAttribute("href", jsonString)
        downloadAnchor.setAttribute("download", `nexlin-agency-export-${Date.now()}.json`)
        document.body.appendChild(downloadAnchor)
        downloadAnchor.click()
        downloadAnchor.remove()
        toast.success("Agency data exported successfully!")
      } else {
        toast.error(res.error || "Failed to export agency data")
      }
    } catch {
      toast.error("Failed to generate export file")
    } finally {
      setExporting(false)
    }
  }

  // Generate live preview text for Missed Call SMS
  const resolvedBrandName = whiteLabelName || name || "Nexlin Agency"
  const previewSmsText = missedCallMessage
    .replace(/\[Agency Name\]/gi, resolvedBrandName)
    .replace(/\[Contact Name\]/gi, "Alex")

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">General Settings</h2>
          <p className="text-text-secondary text-sm">
            Manage your core agency profile, regional defaults, brand assets, and automated telephony.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportData}
            disabled={exporting}
            className="text-xs h-9 flex items-center gap-1.5"
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
            Export CRM Data
          </Button>

          <Button type="submit" disabled={saving} className="flex items-center gap-2 px-5 h-9 text-xs font-semibold shadow-md shadow-primary/25">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Settings
          </Button>
        </div>
      </div>

      {/* 1. Quick Brand Identity & Logo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="w-5 h-5 text-primary" /> Agency Brand Identity
              </CardTitle>
              <CardDescription>Upload your brand icon and set client portal identifiers.</CardDescription>
            </div>
            <Badge variant="outline" className="uppercase font-bold text-xs px-2.5 py-0.5 border-primary/40 text-primary">
              {planTier} Tier
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Logo Uploader Row */}
          <div className="flex items-center gap-5 p-4 rounded-2xl bg-bg-secondary/40 border border-border/80">
            <div className="w-16 h-16 rounded-2xl border border-border bg-bg-card flex items-center justify-center overflow-hidden flex-shrink-0 relative group shadow-sm">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Agency Logo" className="w-full h-full object-contain p-1.5" />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center text-white font-extrabold text-2xl">
                  {(name || "N").charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <h5 className="font-semibold text-xs text-text-primary">Agency Logo Icon</h5>
              <p className="text-[11px] text-text-secondary">
                Recommended 512x512px PNG, SVG, or WebP. Appears on client dashboards and emails.
              </p>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="text-xs h-7 px-3 flex items-center gap-1.5"
              >
                {uploadingLogo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                {logoUrl ? "Replace Logo" : "Upload Logo"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-primary">Agency Legal Company Name</label>
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
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text-primary">Workspace Subdomain</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopySubdomain}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLink ? "Copied" : "Copy Link"}</span>
                  </button>
                  <a
                    href={portalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-text-secondary hover:text-text-primary flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <div className="flex items-center">
                <Input
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  placeholder="acme"
                  className="rounded-r-none font-mono text-xs"
                  required
                />
                <span className="bg-bg-secondary border border-l-0 border-border px-3 py-2 text-xs text-text-secondary rounded-r-md whitespace-nowrap font-mono">
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
                className="font-mono text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Regional & Currency Defaults */}
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
              <label className="text-xs font-semibold text-text-primary">Default Calendar Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              >
                <option value="America/New_York">Eastern Time (US & Canada) - EST (UTC-5)</option>
                <option value="America/Chicago">Central Time (US & Canada) - CST (UTC-6)</option>
                <option value="America/Denver">Mountain Time (US & Canada) - MST (UTC-7)</option>
                <option value="America/Los_Angeles">Pacific Time (US & Canada) - PST (UTC-8)</option>
                <option value="Europe/London">London, Dublin, Lisbon (GMT / BST)</option>
                <option value="Europe/Paris">Paris, Berlin, Rome, Madrid, Amsterdam (CET)</option>
                <option value="Africa/Lagos">West Africa Time (WAT) - Lagos</option>
                <option value="Asia/Dubai">Gulf Standard Time (GST) - Dubai (UTC+4)</option>
                <option value="Asia/Singapore">Singapore / Hong Kong Time (SGT / HKT)</option>
                <option value="Asia/Tokyo">Japan Standard Time (JST)</option>
                <option value="Australia/Sydney">Australian Eastern Time (AEST)</option>
                <option value="UTC">Coordinated Universal Time (UTC)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-primary">Default Proposal & Invoice Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              >
                <option value="USD">USD ($) - United States Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="CAD">CAD ($) - Canadian Dollar</option>
                <option value="AUD">AUD ($) - Australian Dollar</option>
                <option value="NGN">NGN (₦) - Nigerian Naira</option>
                <option value="ZAR">ZAR (R) - South African Rand</option>
                <option value="AED">AED (د.إ) - UAE Dirham</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Missed Call Text Back Automation with Live Smartphone Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <PhoneCall className="w-5 h-5 text-primary" /> Missed Call Text Back Automation
              </CardTitle>
              <CardDescription>
                Automatically dispatch an SMS within 15 seconds whenever an inbound client call is missed.
              </CardDescription>
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
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Message Editor */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-primary">Automated Response SMS Template</label>
                <textarea
                  className="w-full min-h-[120px] rounded-xl border border-border bg-bg-primary p-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                  value={missedCallMessage}
                  onChange={(e) => setMissedCallMessage(e.target.value)}
                  placeholder="Hi, this is [Agency Name]. We missed your call, how can we help?"
                />
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Available merge tags: <code className="text-primary font-mono">[Agency Name]</code>,{" "}
                  <code className="text-primary font-mono">[Contact Name]</code>
                </p>
              </div>

              {/* Live Smartphone SMS Preview Box */}
              <div className="rounded-2xl border border-border/80 bg-bg-secondary/40 p-4 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-text-secondary pb-1 border-b border-border/50">
                  <span className="flex items-center gap-1 font-semibold text-text-primary">
                    <Smartphone className="w-3.5 h-3.5 text-primary" /> Caller&apos;s Phone Preview
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">Live Simulation</span>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="text-[10px] text-center text-text-muted">Today • Missed Call (1:42 PM)</div>
                  {/* SMS Bubble */}
                  <div className="max-w-[85%] bg-primary text-white p-3 rounded-2xl rounded-tl-sm text-xs shadow-md leading-relaxed animate-in fade-in duration-200">
                    {previewSmsText}
                  </div>
                  <div className="text-[10px] text-text-muted text-right pr-2">Delivered via Twilio</div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Form Submit Footer */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-text-muted">
          All settings are scoped to agency tenant ID &amp; cached at the edge.
        </span>
        <Button type="submit" disabled={saving} className="flex items-center gap-2 px-6 h-10 font-bold shadow-md shadow-primary/25">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save General Settings
        </Button>
      </div>
    </form>
  )
}
