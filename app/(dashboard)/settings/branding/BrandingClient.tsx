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
  const [whiteLabelName, setWhiteLabelName] = useState(initialBranding.whiteLabelName || "")
  const [customDomain, setCustomDomain] = useState(initialBranding.customDomain || "")
  const [loginBackgroundImage, setLoginBackgroundImage] = useState(initialBranding.loginBackgroundImage || "")
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    setIsSaving(true)
    const res = await updateAgencyBranding(agencyId, { 
      colors, 
      logoUrl, 
      whiteLabelName, 
      customDomain, 
      loginBackgroundImage 
    })
    if (res.success) {
      router.refresh()
    }
    setIsSaving(false)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold mb-1">White-Label Branding</h2>
          <p className="text-text-secondary">Customize the platform to match your agency's brand.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <Card>
          <CardContent className="p-6 space-y-6">
            <h3 className="font-semibold text-lg">Brand Identity</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Platform Name</label>
              <Input 
                value={whiteLabelName}
                onChange={(e) => setWhiteLabelName(e.target.value)}
                placeholder="e.g. Acme Marketing OS" 
              />
              <p className="text-xs text-text-secondary">Replaces 'Nexlin' across the UI.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Custom Domain</label>
              <Input 
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="app.youragency.com" 
              />
              <p className="text-xs text-text-secondary">Your clients will log in at this domain.</p>
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-medium mb-4">Brand Logo</h4>
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 bg-bg-secondary/50">
                {logoUrl ? (
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                ) : (
                  <Upload className="w-10 h-10 text-text-secondary mb-4" />
                )}
                <input 
                  type="text" 
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="Paste an image URL..."
                  className="mt-4 w-full px-3 py-2 border border-border rounded text-sm bg-bg-primary"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-6">
            <h3 className="font-semibold text-lg">Theme & Assets</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Primary Color</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="color" 
                    value={colors.primary}
                    onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                    className="w-12 h-12 rounded cursor-pointer border-none p-0 bg-transparent"
                  />
                  <Input 
                    type="text" 
                    value={colors.primary}
                    onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                    className="flex-1 uppercase font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-medium mb-4">Login Background</h4>
              <div className="space-y-2">
                <Input 
                  value={loginBackgroundImage}
                  onChange={(e) => setLoginBackgroundImage(e.target.value)}
                  placeholder="Image URL for login screen..." 
                />
                {loginBackgroundImage && (
                  <div className="mt-4 aspect-video rounded-lg overflow-hidden border border-border">
                    <img src={loginBackgroundImage} alt="Login Bg" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
