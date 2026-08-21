"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Check, CreditCard, ExternalLink, ShieldCheck, Sparkles, TrendingDown, DollarSign, Zap } from "lucide-react"
import { generateCheckoutSession, getBYOKSavingsMetrics } from "@/app/actions/billing"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"

const plans = [
  {
    name: "Starter",
    price: "$97",
    interval: "month",
    description: "Perfect for small agencies just getting started.",
    features: [
      "Up to 3 Team Members",
      "1,000 Contacts",
      "Basic Funnel Builder",
      "Email Support",
      "Standard Integrations"
    ]
  },
  {
    name: "Pro",
    price: "$297",
    interval: "month",
    description: "For growing agencies that need more power.",
    features: [
      "Unlimited Team Members",
      "Unlimited Contacts",
      "Advanced Funnel Builder",
      "Priority 24/7 Support",
      "API Access & Webhooks",
      "White-labeling (Basic)"
    ],
    popular: true
  },
  {
    name: "Enterprise",
    price: "$497",
    interval: "month",
    description: "Ultimate power and flexibility for scaling.",
    features: [
      "Everything in Pro",
      "Dedicated Account Manager",
      "Custom SLA",
      "Advanced White-labeling",
      "Custom Integrations",
      "Multi-location Support"
    ]
  }
]

export default function BillingPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [savings, setSavings] = useState<any>(null)
  const router = useRouter()
  const agencyId = "agency-1" // Mock

  useEffect(() => {
    loadSavings()
  }, [])

  const loadSavings = async () => {
    const res = await getBYOKSavingsMetrics()
    if (res.success && res.data) {
      setSavings(res.data)
    }
  }

  const handleSubscribe = async (plan: string, provider: "stripe" | "paystack") => {
    setIsLoading(`${plan}-${provider}`)
    const res = await generateCheckoutSession(provider)
    
    if (res.success && 'data' in res && res.data?.url) {
      router.push(res.data.url)
    } else {
      setIsLoading(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Billing & Plans</h2>
        <p className="text-text-secondary">Manage your subscription, payment methods, and 0% markup BYOK savings.</p>
      </div>

      {/* 0% Markup BYOK Live Savings Widget */}
      <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-text-primary">0% Platform Markup (BYOK Advantage)</h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 border border-emerald-500/30">
                  {savings?.savingsPercentage || 72}% Cheaper than GHL
                </span>
              </div>
              <p className="text-xs text-text-secondary">
                You run direct Twilio, Resend, and OpenAI keys with 0% platform markup fees.
              </p>
            </div>
          </div>

          <div className="text-right flex sm:flex-col items-center sm:items-end justify-between">
            <span className="text-xs text-text-secondary">Estimated Savings</span>
            <span className="text-2xl font-black text-emerald-500">${savings?.totalSaved || "184.20"}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-emerald-500/20 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-primary border border-border">
            <span className="text-text-secondary">SMS Carrier Passthrough:</span>
            <span className="font-bold text-text-primary">${savings?.breakdown?.smsSaved || "62.40"} saved</span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-primary border border-border">
            <span className="text-text-secondary">Email Batch Passthrough:</span>
            <span className="font-bold text-text-primary">${savings?.breakdown?.emailSaved || "42.00"} saved</span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-primary border border-border">
            <span className="text-text-secondary">AI Token Direct Cost:</span>
            <span className="font-bold text-text-primary">${savings?.breakdown?.aiSaved || "79.80"} saved</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <Card key={plan.name} className={`relative flex flex-col ${plan.popular ? 'border-primary shadow-md' : 'border-border'}`}>
            {plan.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="bg-primary text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                  Most Popular
                </span>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-6">
                <span className="text-4xl font-extrabold">{plan.price}</span>
                <span className="text-text-secondary">/{plan.interval}</span>
              </div>
              
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-sm text-text-primary">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-3 mt-auto pt-6 border-t border-border">
                <p className="text-xs font-medium text-text-secondary text-center uppercase tracking-wider mb-2">Select Payment Method</p>
                <Button 
                  className="w-full" 
                  variant={plan.popular ? "default" : "outline"}
                  disabled={!!isLoading}
                  onClick={() => handleSubscribe(plan.name, "stripe")}
                >
                  {isLoading === `${plan.name}-stripe` ? "Processing..." : "Pay with Stripe (Global)"}
                  {!isLoading && <CreditCard className="w-4 h-4 ml-2" />}
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  disabled={!!isLoading}
                  onClick={() => handleSubscribe(plan.name, "paystack")}
                >
                  {isLoading === `${plan.name}-paystack` ? "Processing..." : "Pay with Paystack (Africa)"}
                  {!isLoading && <ExternalLink className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="pt-10 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Dual Global Payments</h2>
          <p className="text-text-secondary">Configure your payment gateways for seamless global collection.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#635BFF] text-white rounded text-xs flex items-center justify-center font-bold">S</div>
                Stripe Configuration
              </CardTitle>
              <CardDescription>Used for clients in North America, Europe, and supported regions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Publishable Key</label>
                <Input type="password" defaultValue="pk_test_1234567890abcdef" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Secret Key</label>
                <Input type="password" defaultValue="sk_test_1234567890abcdef" />
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-sm text-success flex items-center"><ShieldCheck className="w-4 h-4 mr-1" /> Connected successfully</span>
                <Button variant="outline" size="sm">Disconnect</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#0BA4DB] text-white rounded text-xs flex items-center justify-center font-bold">P</div>
                Paystack Configuration
              </CardTitle>
              <CardDescription>Automatically routed for clients in African markets (Nigeria, Ghana, etc.).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Public Key</label>
                <Input type="password" placeholder="pk_test_..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Secret Key</label>
                <Input type="password" placeholder="sk_test_..." />
              </div>
              <div className="pt-2">
                <Button variant="secondary" className="w-full">Connect Paystack</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>SaaS Mode Re-billing</CardTitle>
            <CardDescription>Configure how much you markup usage costs for your sub-accounts (SaaS mode).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 p-4 border border-border rounded-lg bg-bg-secondary/50">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold">SMS / Text Messages</label>
                  <span className="text-xs text-text-secondary">Base: $0.0079/msg</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input type="number" step="0.1" defaultValue="1.5" className="bg-bg-primary" />
                  </div>
                  <span className="text-sm font-medium">x Multiplier</span>
                </div>
                <p className="text-xs text-text-secondary mt-1">You charge: $0.01185/msg</p>
              </div>

              <div className="space-y-2 p-4 border border-border rounded-lg bg-bg-secondary/50">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold">Emails (Mailgun)</label>
                  <span className="text-xs text-text-secondary">Base: $0.0008/email</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input type="number" step="0.1" defaultValue="2.0" className="bg-bg-primary" />
                  </div>
                  <span className="text-sm font-medium">x Multiplier</span>
                </div>
                <p className="text-xs text-text-secondary mt-1">You charge: $0.0016/email</p>
              </div>

              <div className="space-y-2 p-4 border border-border rounded-lg bg-bg-secondary/50">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold">AI Tokens (OpenAI)</label>
                  <span className="text-xs text-text-secondary">Base: $0.02/1k tokens</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input type="number" step="0.1" defaultValue="3.0" className="bg-bg-primary" />
                  </div>
                  <span className="text-sm font-medium">x Multiplier</span>
                </div>
                <p className="text-xs text-text-secondary mt-1">You charge: $0.06/1k tokens</p>
              </div>

              <div className="space-y-2 p-4 border border-border rounded-lg bg-bg-secondary/50">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold">Voice Calls</label>
                  <span className="text-xs text-text-secondary">Base: $0.013/min</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input type="number" step="0.1" defaultValue="1.5" className="bg-bg-primary" />
                  </div>
                  <span className="text-sm font-medium">x Multiplier</span>
                </div>
                <p className="text-xs text-text-secondary mt-1">You charge: $0.0195/min</p>
              </div>
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button>Save Markup Settings</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
