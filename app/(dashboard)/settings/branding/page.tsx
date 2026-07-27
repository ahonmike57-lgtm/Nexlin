"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Palette, Globe, Mail, Shield, Save, CheckCircle2, Loader2 } from "lucide-react"
import { getBrandingSettings, saveBrandingSettings } from "@/app/actions/branding"
import { toast } from "sonner"

export default function BrandingSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
      }
      setLoading(false)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await saveBrandingSettings(formData)
    if (res.success) {
      toast.success(res.message)
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
