"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { saveAiSetting } from "@/app/actions/aiSettings"

export default function AiSettingsClient({ initialSettings, agencyId }: { initialSettings: any[], agencyId: string }) {
  const [settings, setSettings] = useState(initialSettings)
  const [loading, setLoading] = useState<string | null>(null)

  // Local form states
  const [googleKey, setGoogleKey] = useState(settings.find(s => s.provider === "google")?.apiKey || "")
  const [googleModel, setGoogleModel] = useState(settings.find(s => s.provider === "google")?.modelName || "gemini-3.5-flash")

  const [openAiKey, setOpenAiKey] = useState(settings.find(s => s.provider === "openai")?.apiKey || "")
  const [openAiModel, setOpenAiModel] = useState(settings.find(s => s.provider === "openai")?.modelName || "gpt-4o")

  const [anthropicKey, setAnthropicKey] = useState(settings.find(s => s.provider === "anthropic")?.apiKey || "")
  const [anthropicModel, setAnthropicModel] = useState(settings.find(s => s.provider === "anthropic")?.modelName || "claude-5-sonnet")

  const activeProvider = settings.find(s => s.isActive)?.provider || "google"

  const handleSave = async (provider: string, apiKey: string, modelName: string, makeActive: boolean) => {
    if (!apiKey) {
      toast.error("Please enter an API key")
      return
    }

    setLoading(provider)
    const res = await saveAiSetting(provider, apiKey, modelName, makeActive)
    setLoading(null)

    if (res.success) {
      toast.success(`${provider} settings saved!`)
      // Refresh local settings state
      if (makeActive) {
        setSettings(prev => {
          const updated = prev.map(s => ({ ...s, isActive: false }))
          const existing = updated.find(s => s.provider === provider)
          if (existing) {
            existing.apiKey = apiKey
            existing.modelName = modelName
            existing.isActive = true
            return updated
          } else {
            return [...updated, { provider, apiKey, modelName, isActive: true }]
          }
        })
      }
    } else {
      toast.error(res.error || "Failed to save settings")
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Settings</h1>
        <p className="text-text-secondary text-sm">Configure your preferred AI models and API keys for the agency.</p>
      </div>

      <div className="grid gap-6">
        
        {/* OpenAI Card */}
        <Card className={`border-2 ${activeProvider === 'openai' ? 'border-primary' : 'border-border'}`}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>OpenAI</CardTitle>
                <CardDescription>Use models like GPT-4o and GPT-4 Turbo.</CardDescription>
              </div>
              {activeProvider === 'openai' && <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">Active Default</span>}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">API Key</label>
              <Input 
                type="password"
                placeholder="sk-..." 
                value={openAiKey}
                onChange={(e) => setOpenAiKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Model</label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={openAiModel}
                onChange={(e) => setOpenAiModel(e.target.value)}
              >
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={() => handleSave("openai", openAiKey, openAiModel, false)} 
                disabled={loading === "openai"}
                variant="outline"
              >
                {loading === "openai" ? "Saving..." : "Save Settings"}
              </Button>
              <Button 
                onClick={() => handleSave("openai", openAiKey, openAiModel, true)} 
                disabled={loading === "openai" || activeProvider === 'openai'}
              >
                Set as Default Provider
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Anthropic Card */}
        <Card className={`border-2 ${activeProvider === 'anthropic' ? 'border-primary' : 'border-border'}`}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Anthropic (Claude)</CardTitle>
                <CardDescription>Use models like Claude 5 Opus, 5 Sonnet, and 4.5 Haiku.</CardDescription>
              </div>
              {activeProvider === 'anthropic' && <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">Active Default</span>}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">API Key</label>
              <Input 
                type="password"
                placeholder="sk-ant-..." 
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Model</label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={anthropicModel}
                onChange={(e) => setAnthropicModel(e.target.value)}
              >
                <option value="claude-5-opus">Claude 5 Opus</option>
                <option value="claude-5-sonnet">Claude 5 Sonnet</option>
                <option value="claude-4-5-haiku">Claude 4.5 Haiku</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={() => handleSave("anthropic", anthropicKey, anthropicModel, false)} 
                disabled={loading === "anthropic"}
                variant="outline"
              >
                {loading === "anthropic" ? "Saving..." : "Save Settings"}
              </Button>
              <Button 
                onClick={() => handleSave("anthropic", anthropicKey, anthropicModel, true)} 
                disabled={loading === "anthropic" || activeProvider === 'anthropic'}
              >
                Set as Default Provider
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Google Card */}
        <Card className={`border-2 ${activeProvider === 'google' ? 'border-primary' : 'border-border'}`}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Google (Gemini)</CardTitle>
                <CardDescription>Use models like Gemini 3.1 Pro and 3.5 Flash.</CardDescription>
              </div>
              {activeProvider === 'google' && <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">Active Default</span>}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">API Key</label>
              <Input 
                type="password"
                placeholder="AIza..." 
                value={googleKey}
                onChange={(e) => setGoogleKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Model</label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={googleModel}
                onChange={(e) => setGoogleModel(e.target.value)}
              >
                <option value="gemini-3.1-pro">Gemini 3.1 Pro</option>
                <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={() => handleSave("google", googleKey, googleModel, false)} 
                disabled={loading === "google"}
                variant="outline"
              >
                {loading === "google" ? "Saving..." : "Save Settings"}
              </Button>
              <Button 
                onClick={() => handleSave("google", googleKey, googleModel, true)} 
                disabled={loading === "google" || activeProvider === 'google'}
              >
                Set as Default Provider
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
