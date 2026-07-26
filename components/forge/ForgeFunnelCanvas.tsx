"use client"

import { useState } from "react"
import { GitFork, BarChart3, CheckCircle2, ArrowRight, Sparkles, Layers, Play, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function ForgeFunnelCanvas() {
  const [activeStep, setActiveStep] = useState(1)

  const steps = [
    { id: 1, name: "Landing Page", slug: "home", type: "Showcase & CTA", conversionRate: "42.8%", visitors: 1420 },
    { id: 2, name: "Pre-Qual Credit Form", slug: "prequal", type: "Lead Ingest", conversionRate: "28.5%", visitors: 608 },
    { id: 3, name: "Thank You & Call Porter", slug: "thankyou", type: "60s Callback", conversionRate: "94.2%", visitors: 173 }
  ]

  const abVariants = [
    { name: "Variant A (Default Hero)", headline: "Drive Home Your Dream Vehicle Today", conversions: 74, rate: "41.2%" },
    { name: "Variant B (Urgency Offer)", headline: "Get Approved in 60 Seconds - $0 Down Today", conversions: 99, rate: "48.6%", winner: true }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <GitFork className="w-5 h-5 text-primary" /> Visual Funnel Canvas & A/B Split Test
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">Multi-step deal flow mapped directly into NEXLIN CRM & Call Porter callbacks.</p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">A/B Testing Active</Badge>
      </div>

      {/* Visual Step Map */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((step, i) => (
          <div key={step.id} className="relative">
            <Card 
              className={`cursor-pointer transition-all ${activeStep === step.id ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-bg-primary hover:border-primary/50'}`}
              onClick={() => setActiveStep(step.id)}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-primary">Step 0{step.id}</span>
                  <Badge variant="outline" className="text-[10px]">{step.type}</Badge>
                </div>
                <CardTitle className="text-sm font-semibold">{step.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center justify-between text-xs text-text-secondary font-mono mt-2 pt-2 border-t border-border/50">
                  <span>Visitors: {step.visitors}</span>
                  <span className="font-bold text-success">{step.conversionRate} Conv</span>
                </div>
              </CardContent>
            </Card>

            {i < steps.length - 1 && (
              <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-bg-primary border border-border items-center justify-center text-text-secondary">
                <ArrowRight className="w-3 h-3" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* A/B Variant Testing Card */}
      <Card className="bg-bg-primary border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Active Headline A/B Split Test
            </span>
            <Button size="sm" variant="outline" className="h-7 text-xs">
              <Sparkles className="w-3 h-3 mr-1 text-primary" /> Generate Variant C
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {abVariants.map((v, i) => (
            <div key={i} className={`p-3 rounded-lg border flex items-center justify-between text-xs ${v.winner ? 'border-success/50 bg-success/5' : 'border-border bg-bg-secondary/40'}`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text-primary">{v.name}</span>
                  {v.winner && <Badge className="bg-success text-white text-[9px]">Winning Variant</Badge>}
                </div>
                <p className="text-text-secondary italic mt-0.5">"{v.headline}"</p>
              </div>
              <div className="text-right font-mono">
                <div className="font-bold text-text-primary">{v.rate}</div>
                <div className="text-[10px] text-text-secondary">{v.conversions} Leads</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
