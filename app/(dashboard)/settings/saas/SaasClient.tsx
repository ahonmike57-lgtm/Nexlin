"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, MessageSquare, Mail, Bot, PhoneCall, Wallet, ArrowUpRight, Save, TrendingUp } from "lucide-react"
import { saveRebillingMarkup } from "@/app/actions/saas"
import { toast } from "sonner"

const ICONS: Record<string, any> = {
  "sms": MessageSquare,
  "email": Mail,
  "ai_tokens": Bot,
  "call_minutes": PhoneCall
}

const LABELS: Record<string, string> = {
  "sms": "SMS Messages",
  "email": "Email Sending",
  "ai_tokens": "AI Usage (per 1k tokens)",
  "call_minutes": "Phone Calls (per min)"
}

export default function SaasClient({ 
  agencyId, 
  initialMarkups, 
  initialWallet 
}: { 
  agencyId: string, 
  initialMarkups: any[],
  initialWallet: any
}) {
  const [markups, setMarkups] = useState(initialMarkups)
  const [isSaving, setIsSaving] = useState<string | null>(null)

  const handleSave = async (type: string, multiplier: number) => {
    setIsSaving(type)
    const res = await saveRebillingMarkup(agencyId, type, multiplier)
    if (res.success) {
      toast.success(`${LABELS[type]} markup saved!`)
    } else {
      toast.error("Failed to save markup")
    }
    setIsSaving(null)
  }

  const updateMultiplier = (type: string, newMultiplier: number) => {
    setMarkups(prev => prev.map(m => m.type === type ? { ...m, multiplier: newMultiplier } : m))
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SaaS Mode & Rebilling</h1>
          <p className="text-text-secondary mt-1">Configure your profit margins for underlying usage costs.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet Overview */}
        <div className="md:col-span-1 space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-primary mb-4">
                <Wallet className="w-5 h-5" />
                <h2 className="font-semibold text-lg">Agency Wallet</h2>
              </div>
              <div className="text-4xl font-bold mb-2">
                ${(initialWallet?.balance || 0).toFixed(2)}
              </div>
              <p className="text-sm text-text-secondary mb-4">
                This is your master pool of credits used to pay Twilio, Mailgun, and OpenAI.
              </p>
              <Button className="w-full">Add Credits</Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-success" />
                <h2 className="font-semibold text-lg">SaaS Revenue</h2>
              </div>
              <div className="text-3xl font-bold mb-1">$0.00</div>
              <p className="text-sm text-text-secondary">Profit from sub-account usage this month.</p>
            </CardContent>
          </Card>
        </div>

        {/* Rebilling Configurator */}
        <div className="md:col-span-2 space-y-4">
          {markups.map((markup) => {
            const Icon = ICONS[markup.type] || Building2
            const label = LABELS[markup.type] || markup.type
            
            // Calculate profits
            const exampleUsage = markup.type === 'ai_tokens' ? 1000 : 1000 // example volume
            const cost = markup.baseCost * exampleUsage
            const clientPrice = cost * markup.multiplier
            const profit = clientPrice - cost

            return (
              <Card key={markup.type} className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-bg-secondary flex items-center justify-center">
                        <Icon className="w-5 h-5 text-text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{label}</h3>
                        <p className="text-sm text-text-secondary">Base Cost: ${markup.baseCost.toFixed(3)}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                      {markup.multiplier.toFixed(1)}x Markup
                    </Badge>
                  </div>

                  <div className="space-y-6">
                    {/* Slider */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>1.0x (At Cost)</span>
                        <span>10.0x (Max Profit)</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        step="0.1" 
                        value={markup.multiplier}
                        onChange={(e) => updateMultiplier(markup.type, parseFloat(e.target.value))}
                        className="w-full accent-primary"
                      />
                    </div>

                    {/* Profit Calculator */}
                    <div className="bg-bg-secondary rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="text-sm">
                        <p className="text-text-secondary mb-1">If a client uses <strong>{exampleUsage}</strong> units:</p>
                        <div className="flex gap-4">
                          <div>
                            <span className="block text-xs text-text-secondary uppercase tracking-wider">Your Cost</span>
                            <span className="font-medium">${cost.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="block text-xs text-text-secondary uppercase tracking-wider">Client Pays</span>
                            <span className="font-medium">${clientPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block text-xs text-text-secondary uppercase tracking-wider">Your Profit</span>
                        <span className="text-xl font-bold text-success flex items-center justify-end gap-1">
                          <ArrowUpRight className="w-4 h-4" /> ${profit.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        size="sm" 
                        onClick={() => handleSave(markup.type, markup.multiplier)}
                        disabled={isSaving === markup.type}
                      >
                        <Save className="w-4 h-4 mr-2" /> 
                        {isSaving === markup.type ? "Saving..." : "Save Config"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
