"use client"

import { useState } from "react"
import { Play, Terminal, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function WebhookPayloadSimulator() {
  const [provider, setProvider] = useState("shopify")
  const [loading, setLoading] = useState(false)

  const handleSimulate = async () => {
    setLoading(true)
    try {
      let endpoint = "/api/webhooks/shopify"
      let payload = { topic: "orders/create", email: "test.lead@acme.com", total_price: "297.00" }

      if (provider === "whatsapp") {
        endpoint = "/api/webhooks/whatsapp"
        payload = { object: "whatsapp_business_account", entry: [{ changes: [{ value: { messages: [{ from: "14155550192", text: { body: "Simulated Test WhatsApp Message" } }] } }] }] } as any
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.success(`Successfully dispatched test ${provider} webhook payload!`)
      } else {
        toast.error("Webhook simulation failed")
      }
    } catch {
      toast.error("Simulation request error")
    }
    setLoading(false)
  }

  return (
    <div className="p-4 rounded-xl border border-border bg-bg-primary shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-primary">Live Webhook Simulator</h4>
        </div>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="text-xs px-2 py-1 bg-bg-secondary border border-border rounded text-text-primary focus:outline-none"
        >
          <option value="shopify">Shopify Orders</option>
          <option value="whatsapp">WhatsApp Business</option>
        </select>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary">Dispatch test JSON webhook payload to verified endpoint.</span>
        <Button size="sm" onClick={handleSimulate} disabled={loading}>
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
          Test Dispatch
        </Button>
      </div>
    </div>
  )
}
