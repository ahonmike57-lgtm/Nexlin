"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Check, CreditCard, ExternalLink, ShieldCheck } from "lucide-react"
import { generateCheckoutSession } from "@/app/actions/billing"
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
  const router = useRouter()
  const agencyId = "agency-1" // Mock

  const handleSubscribe = async (plan: string, provider: "stripe" | "paystack") => {
    setIsLoading(`${plan}-${provider}`)
    const res = await generateCheckoutSession(agencyId, provider)
    
    if (res.success && res.url) {
      router.push(res.url)
    } else {
      setIsLoading(null)
      // Error handling
    }
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Billing & Plans</h2>
        <p className="text-text-secondary">Manage your subscription and payment methods.</p>
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
            <CardTitle>Billing Settings</CardTitle>
            <CardDescription>How you charge your clients.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-w-sm">
              <div className="space-y-2">
                <label className="text-sm font-medium">Default Currency</label>
                <select className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <option>USD ($)</option>
                  <option>EUR (€)</option>
                  <option>GBP (£)</option>
                  <option>NGN (₦)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
