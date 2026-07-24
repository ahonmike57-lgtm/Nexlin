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
              <Card key={markup.type} className="border-border transition-all duration-300 hover:shadow-lg hover:border-primary/30 group bg-bg-primary/50 backdrop-blur-sm">
                <CardContent className="p-7">
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-bg-secondary border border-border/50 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/30 transition-colors shadow-sm">
                        <Icon className="w-6 h-6 text-text-primary group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-text-primary">{label}</h3>
                        <p className="text-sm text-text-secondary mt-0.5">Base Cost: <span className="font-medium text-text-primary">${markup.baseCost.toFixed(3)}</span></p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-sm px-3 py-1 shadow-sm">
                      {markup.multiplier.toFixed(1)}x Markup
                    </Badge>
                  </div>

                  <div className="space-y-8">
                    {/* Slider */}
                    <div className="bg-bg-secondary/50 p-5 rounded-xl border border-border/50">
                      <div className="flex justify-between text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
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
                        className="w-full accent-primary h-2 bg-border rounded-lg appearance-none cursor-pointer hover:accent-primary-hover transition-all"
                      />
                    </div>

                    {/* Profit Calculator */}
                    <div className="bg-gradient-to-br from-bg-secondary to-bg-tertiary rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-border shadow-inner">
                      <div className="text-sm">
                        <p className="text-text-secondary mb-3 font-medium">If a client uses <strong>{exampleUsage}</strong> units:</p>
                        <div className="flex gap-6">
                          <div className="bg-bg-primary px-3 py-2 rounded-lg border border-border/50 shadow-sm">
                            <span className="block text-[10px] text-text-secondary uppercase tracking-widest font-bold mb-1">Your Cost</span>
                            <span className="font-semibold text-text-primary">${cost.toFixed(2)}</span>
                          </div>
                          <div className="bg-bg-primary px-3 py-2 rounded-lg border border-border/50 shadow-sm">
                            <span className="block text-[10px] text-text-secondary uppercase tracking-widest font-bold mb-1">Client Pays</span>
                            <span className="font-semibold text-text-primary">${clientPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right sm:border-l sm:border-border sm:pl-6">
                        <span className="block text-[10px] text-success uppercase tracking-widest font-bold mb-1">Your Profit</span>
                        <span className="text-3xl font-extrabold text-success flex items-center justify-end gap-1 tracking-tight">
                          <ArrowUpRight className="w-6 h-6" /> ${profit.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button 
                        size="lg" 
                        onClick={() => handleSave(markup.type, markup.multiplier)}
                        disabled={isSaving === markup.type}
                        className="shadow-md hover:shadow-lg transition-all"
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
