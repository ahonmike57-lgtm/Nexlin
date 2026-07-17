"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Save, Upload, Mail, ShieldCheck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { updateAgencyBranding } from "@/app/actions/settings"
import { useRouter } from "next/navigation"

export default function BrandingClient({ initialBranding, agencyId }: { initialBranding: any, agencyId: string }) {
  const [colors, setColors] = useState(
    initialBranding.brandColors ? JSON.parse(initialBranding.brandColors) : { primary: "#000000" }
  )
  const [logoUrl, setLogoUrl] = useState(initialBranding.logoUrl || "")
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    setIsSaving(true)
    const res = await updateAgencyBranding(agencyId, { colors, logoUrl })
    if (res.success) {
      router.refresh()
    }
    setIsSaving(false)
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-6 max-w-4xl mx-auto py-8">
      <div>
        <h2 className="text-2xl font-semibold mb-1">White-Label Branding</h2>
        <p className="text-text-secondary">Customize the platform to match your agency's brand.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <Card>
          <CardContent className="p-6 space-y-6">
            <h3 className="font-semibold text-lg">Brand Logo</h3>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 bg-bg-secondary/50">
              {logoUrl ? (
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <Upload className="w-10 h-10 text-text-secondary mb-4" />
              )}
              <p className="text-sm text-text-secondary text-center mt-2">
                Drag and drop your logo here, or click to browse.
              </p>
              <input 
                type="text" 
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="Or paste an image URL..."
                className="mt-4 w-full px-3 py-2 border border-border rounded text-sm bg-bg-primary"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-6">
            <h3 className="font-semibold text-lg">Brand Colors</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Primary Color</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="color" 
                    value={colors.primary}
                    onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                    className="w-12 h-12 rounded cursor-pointer border-none p-0"
                  />
                  <input 
                    type="text" 
                    value={colors.primary}
                    onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                    className="flex-1 px-3 py-2 border border-border rounded bg-bg-primary text-sm uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border mt-6">
              <h4 className="text-sm font-medium mb-4">Preview</h4>
              <div className="p-4 border border-border rounded-lg bg-bg-secondary space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded" style={{ backgroundColor: colors.primary }}></div>
                  <span className="text-sm font-medium">Primary Accent</span>
                </div>
                <Button style={{ backgroundColor: colors.primary, borderColor: colors.primary }} className="w-full text-white">
                  Sample Button
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Settings</CardTitle>
          <CardDescription>Configure the sender details for automated platform emails.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-lg">
          <div className="space-y-2">
            <label className="text-sm font-medium">Sender Name</label>
            <Input defaultValue="Acme Support" />
          </div>
          <div className="space-y-2 relative">
            <label className="text-sm font-medium">Sender Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <Input defaultValue="support@acmecorp.com" className="pl-9" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg text-warning text-sm">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <p>DNS verification is required to send emails from your domain. Check the Domains tab.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
