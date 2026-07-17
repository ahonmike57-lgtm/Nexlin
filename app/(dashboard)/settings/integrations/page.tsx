"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Link2, Webhook, Zap } from "lucide-react"

export default function IntegrationsSettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Integrations</h2>
        <p className="text-text-secondary">Connect external apps and services directly into Nexlin.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-[#FF4F00]" /> Zapier</CardTitle>
            <CardDescription>Connect with 5000+ apps.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Connect</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Webhook className="w-5 h-5 text-primary" /> Webhooks</CardTitle>
            <CardDescription>Send data securely to any endpoint.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" className="w-full">Manage Webhooks</Button>
          </CardContent>
        </Card>
      </div>

      <div className="p-6 border border-border rounded-xl bg-bg-secondary text-center mt-8">
        <Link2 className="w-10 h-10 text-text-secondary mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Looking for more integrations?</h3>
        <p className="text-text-secondary mb-4 max-w-sm mx-auto">Check out the App Marketplace or configure MCP connections for deeper AI integration.</p>
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => window.location.href='/marketplace'}>Go to Marketplace</Button>
          <Button variant="outline" onClick={() => window.location.href='/settings/mcp'}>Manage MCP</Button>
        </div>
      </div>
    </div>
  )
}
