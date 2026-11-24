"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Palette, Mail, Save, Loader2, Upload, Sparkles } from "lucide-react"
import { getBrandingSettings, saveBrandingSettings } from "@/app/actions/branding"
import { toast } from "sonner"

export default function BrandingSettingsPage() {
  const router = useRouter()
  const logoInputRef = useRef<HTMLInputElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [formData, setFormData] = useState({
    companyName: "NEXLIN Agency",
    customDomain: "crm.nexlin.site",
    primaryColor: "#1A3CFF",
    accentColor: "#F5A623",
    logoUrl: "",
    faviconUrl: "",
    smtpHost: "smtp.sendgrid.net",
    smtpPort: "587",
    smtpUser: "apikey"
  })

  useEffect(() => {
    getBrandingSettings().then(res => {
      if (res.success && res.data) {
        setFormData(res.data)
      } else if (!res.success) {
        toast.error(res.error || "Failed to load branding settings")
      }
      setLoading(false)
    })
  }, [])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    try {
      const payload = new FormData()
      payload.append("file", file)
      payload.append("folder", "branding")

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: payload
      })
      const data = await res.json()

      if (data.success && data.url) {
        setFormData(prev => ({ ...prev, logoUrl: data.url }))
        toast.success("Logo uploaded! Click 'Save Branding Configuration' to apply.")
      } else {
        toast.error(data.error || "Failed to upload logo")
      }
    } catch {
      toast.error("Error uploading logo image")
    } finally {
      setUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await saveBrandingSettings(formData)
    if (res.success) {
      toast.success(res.message || "Branding settings saved!")
      router.refresh()
    } else {
      toast.error(res.error || "Failed to save branding")
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
          <Palette className="w-6 h-6 text-primary" /> White-Label Branding & Custom Domain
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          Customize agency logo, primary brand colors, custom CNAME login portal, and dedicated SMTP relay server.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Brand Identity */}
        <Card className="bg-bg-primary border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" /> Agency Visual Identity
            </CardTitle>
            <CardDescription className="text-xs">Set primary colors and portal logos visible to sub-account client logins.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo Uploader + Preview */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-bg-secondary/50 border border-border">
              <div className="w-16 h-16 rounded-xl border border-border bg-bg-primary flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                {formData.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={formData.logoUrl} alt="Agency Logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-white font-extrabold text-xl"
                    style={{ backgroundColor: formData.primaryColor || "#1A3CFF" }}
                  >
                    {(formData.companyName || "N").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-medium text-text-secondary">Brand Logo & URL</label>
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
                    className="h-7 text-xs gap-1.5"
                  >
                    {uploadingLogo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    {formData.logoUrl ? "Replace Logo" : "Upload Logo"}
                  </Button>
                </div>
                <Input
                  value={formData.logoUrl}
                  onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="https://... or upload an image"
                  className="bg-bg-primary text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Company / Agency Name</label>
                <Input 
                  value={formData.companyName}
                  onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                  className="bg-bg-secondary text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Custom Login CNAME Domain</label>
                <Input 
                  value={formData.customDomain}
                  onChange={e => setFormData({ ...formData, customDomain: e.target.value })}
                  placeholder="crm.youragency.com"
                  className="bg-bg-secondary text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Primary Brand Color (Hex)</label>
                <div className="flex gap-2 items-center">
                  <Input 
                    type="color"
                    value={formData.primaryColor}
                    onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-12 h-9 p-1 bg-bg-secondary cursor-pointer"
                  />
                  <Input 
                    value={formData.primaryColor}
                    onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="bg-bg-secondary text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Accent Brand Color (Hex)</label>
                <div className="flex gap-2 items-center">
                  <Input 
                    type="color"
                    value={formData.accentColor}
                    onChange={e => setFormData({ ...formData, accentColor: e.target.value })}
                    className="w-12 h-9 p-1 bg-bg-secondary cursor-pointer"
                  />
                  <Input 
                    value={formData.accentColor}
                    onChange={e => setFormData({ ...formData, accentColor: e.target.value })}
                    className="bg-bg-secondary text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary">Favicon URL (Optional)</label>
              <Input
                value={formData.faviconUrl}
                onChange={e => setFormData({ ...formData, faviconUrl: e.target.value })}
                placeholder="https://youragency.com/favicon.ico"
                className="bg-bg-secondary text-xs font-mono"
              />
            </div>

            {/* Live Theme Preview Strip */}
            <div className="p-3.5 rounded-xl border border-border bg-bg-secondary/40 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm overflow-hidden"
                  style={{ backgroundColor: formData.primaryColor || "#1A3CFF" }}
                >
                  {formData.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={formData.logoUrl} alt="Preview" className="w-full h-full object-contain bg-bg-primary p-0.5" />
                  ) : (
                    (formData.companyName || "N").charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Live Theme Preview: {formData.companyName || "NEXLIN Agency"}
                  </p>
                  <p className="text-[11px] text-text-secondary">
                    Portal Domain: {formData.customDomain || "Default workspace URL"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="px-3 py-1 rounded-lg text-[11px] font-semibold text-white shadow-sm"
                  style={{ backgroundColor: formData.primaryColor || "#1A3CFF" }}
                >
                  Primary Button
                </span>
                <span
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-white shadow-sm"
                  style={{ backgroundColor: formData.accentColor || "#F5A623" }}
                >
                  Accent Badge
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom SMTP Server */}
        <Card className="bg-bg-primary border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" /> Dedicated Agency SMTP Server
            </CardTitle>
            <CardDescription className="text-xs">Send white-labeled emails using your SendGrid, Mailgun, or Amazon SES credentials.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">SMTP Host</label>
                <Input 
                  value={formData.smtpHost}
                  onChange={e => setFormData({ ...formData, smtpHost: e.target.value })}
                  className="bg-bg-secondary text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">SMTP Port</label>
                <Input 
                  value={formData.smtpPort}
                  onChange={e => setFormData({ ...formData, smtpPort: e.target.value })}
                  className="bg-bg-secondary text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">SMTP Username</label>
                <Input 
                  value={formData.smtpUser}
                  onChange={e => setFormData({ ...formData, smtpUser: e.target.value })}
                  className="bg-bg-secondary text-xs font-mono"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 text-white gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Branding Configuration
          </Button>
        </div>
      </form>
    </div>
  )
}