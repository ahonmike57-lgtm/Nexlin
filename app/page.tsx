"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Bot,
  Globe,
  Shield,
  PhoneCall,
  Route,
  Zap,
  Quote,
  Sparkles,
  Kanban,
  FileText,
  Mail,
  Users,
  Check,
  Play,
  TrendingUp,
  Cpu,
  Flame,
  Star,
  Activity,
  DollarSign
} from "lucide-react"

export default function Home() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual")
  const [activeHeroTab, setActiveHeroTab] = useState<"pipeline" | "voice" | "cpq">("pipeline")
  const [callStep, setCallStep] = useState(1)

  // Auto-cycle call porter visual steps
  useEffect(() => {
    const interval = setInterval(() => {
      setCallStep((prev) => (prev % 4) + 1)
    }, 2800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      {/* Dynamic Ambient Aurora Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-primary/20 via-blue-500/15 to-purple-500/10 blur-[130px] rounded-full" />
        <div className="absolute top-[40%] -left-40 w-[600px] h-[600px] bg-emerald-500/10 blur-[140px] rounded-full" />
        <div className="absolute top-[70%] -right-40 w-[600px] h-[600px] bg-primary/10 blur-[140px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 w-full bg-bg-primary/80 backdrop-blur-xl border-b border-border/60 transition-all duration-300">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8 max-w-7xl">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center shadow-md shadow-primary/25 group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-lg tracking-wider">N</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-text-primary via-primary to-blue-600">
              NEXLIN
            </span>
            <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-widest text-primary border-primary/30 ml-1">
              OS 2.0
            </Badge>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#call-porter" className="hover:text-primary transition-colors">Voice AI & Routing</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-primary transition-colors">Agencies</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold hover:text-primary px-3 py-2 transition-colors">
              Sign In
            </Link>
            <Link href="/register">
              <Button size="sm" className="shadow-lg shadow-primary/25 font-semibold px-4">
                Get Started <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-24 pb-20 px-4 sm:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
          {/* Animated Announcement Pill */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-8 shadow-sm backdrop-blur-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary animate-spin" style={{ animationDuration: "6s" }} />
            <span>Introducing 0% Re-Billing Markup & Autonomous AI SDR</span>
            <ArrowRight className="w-3 h-3 ml-0.5" />
          </motion.div>

          {/* Hero Heading with Gradient Stagger */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-5xl leading-[1.08] mb-6"
          >
            Every part of your agency. <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-500 to-indigo-600">
              One intelligent operating system.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl text-base sm:text-xl text-text-secondary mb-10 leading-relaxed"
          >
            Replace 14 disjointed tools. Run your CRM, 24/7 AI voice receptionist, CPQ proposal generation, and multi-channel marketing with 0% hidden carrier fees.
          </motion.p>

          {/* Call to Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-13 px-8 text-base font-bold shadow-xl shadow-primary/30">
                Start 14-Day Free Trial <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-13 px-8 text-base bg-bg-secondary/60 hover:bg-bg-secondary border-border">
                <Play className="w-4 h-4 mr-2 text-primary" /> View Live Demo
              </Button>
            </Link>
          </motion.div>

          {/* Interactive Hero App Interface Preview */}
          {/* Interactive Laptop Hero Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 w-full max-w-5xl rounded-3xl p-3 sm:p-4 bg-slate-950/90 dark:bg-neutral-950 border border-slate-800 shadow-2xl relative"
          >
            {/* Laptop Top Bezel with Camera Dot */}
            <div className="flex items-center justify-center pb-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-800 ring-1 ring-slate-700/60 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>

            {/* Laptop Inner Screen Frame */}
            <div className="rounded-2xl border border-border/80 bg-bg-primary/95 backdrop-blur-2xl shadow-inner overflow-hidden text-left">
              {/* Top Window Bar */}
              <div className="p-3 border-b border-border bg-bg-secondary/70 flex flex-wrap items-center justify-between gap-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 mr-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="bg-bg-primary/80 border border-border/80 rounded-md px-2.5 py-1 text-xs font-mono text-text-secondary flex items-center gap-1.5 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <span className="font-semibold text-text-primary">nexlin.app</span>/dashboard
                  </div>
                </div>

                {/* Tab Selector */}
                <div className="flex items-center gap-1 bg-bg-secondary p-1 rounded-lg border border-border text-xs">
                  <button
                    onClick={() => setActiveHeroTab("pipeline")}
                    className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                      activeHeroTab === "pipeline" ? "bg-primary text-white shadow-sm" : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    Sales Pipeline
                  </button>
                  <button
                    onClick={() => setActiveHeroTab("voice")}
                    className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                      activeHeroTab === "voice" ? "bg-primary text-white shadow-sm" : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    Voice AI Routing
                  </button>
                  <button
                    onClick={() => setActiveHeroTab("cpq")}
                    className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                      activeHeroTab === "cpq" ? "bg-primary text-white shadow-sm" : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    CPQ Proposal
                  </button>
                </div>
              </div>

              {/* Tab 1: Live Interactive Pipeline */}
              {activeHeroTab === "pipeline" && (
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-left bg-bg-secondary/30">
                  <div className="p-4 rounded-xl bg-bg-primary border border-border space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-text-secondary uppercase">
                      <span>New Leads (4)</span>
                      <Badge variant="outline" className="text-blue-500 bg-blue-500/10 font-bold">$24,500</Badge>
                    </div>
                    <div className="p-3.5 rounded-lg bg-bg-secondary border border-border/80 shadow-xs space-y-1.5">
                      <div className="font-bold text-sm text-text-primary">Apex Dynamics</div>
                      <div className="text-xs text-text-secondary">Enterprise SaaS • $15,000</div>
                      <div className="pt-1 flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px] text-emerald-500 bg-emerald-500/10 font-semibold border-emerald-500/30">
                          🔥 Lead Score: 94
                        </Badge>
                        <span className="text-[10px] text-text-secondary">Just now</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-bg-primary border-2 border-primary/40 space-y-3 relative shadow-md">
                    <div className="flex items-center justify-between text-xs font-bold text-primary uppercase">
                      <span>Proposal Sent (2)</span>
                      <Badge variant="outline" className="text-primary bg-primary/10 font-bold border-primary/30">$48,000</Badge>
                    </div>
                    <div className="p-3.5 rounded-lg bg-primary/5 border border-primary/30 shadow-xs space-y-1.5">
                      <div className="font-bold text-sm text-primary">Cyberdyne Systems</div>
                      <div className="text-xs text-text-secondary">CPQ Quote #1049 • Signed & Verified</div>
                      <div className="pt-1 flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px] text-purple-500 bg-purple-500/10 font-semibold border-purple-500/30">
                          ⚡ Drip Active
                        </Badge>
                        <span className="text-[10px] text-primary font-medium">Viewing Doc</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-bg-primary border border-border space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-500 uppercase">
                      <span>Closed Won (18)</span>
                      <Badge variant="outline" className="text-emerald-500 bg-emerald-500/10 font-bold border-emerald-500/30">$142,850</Badge>
                    </div>
                    <div className="p-3.5 rounded-lg bg-emerald-500/5 border border-emerald-500/30 shadow-xs space-y-1.5">
                      <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400">Nova Health Clinics</div>
                      <div className="text-xs text-text-secondary">Annual Retainer • Confetti Triggered 🎉</div>
                      <div className="pt-1 flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px] text-emerald-500 bg-emerald-500/10 font-semibold border-emerald-500/30">
                          Paid via Stripe
                        </Badge>
                        <span className="text-[10px] text-text-secondary">Auto-provisioned</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Voice AI Live Audio Router */}
              {activeHeroTab === "voice" && (
                <div className="p-6 space-y-4 bg-bg-secondary/20">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 text-primary flex items-center justify-center">
                        <PhoneCall className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-text-primary">Autonomous Inbound Voice Porter</h4>
                        <p className="text-xs text-text-secondary">Real-time caller transcription, intent mapping & live transfer</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs text-emerald-500 bg-emerald-500/10 border-emerald-500/30 font-semibold">
                      94.2% AI Autonomous Resolution
                    </Badge>
                  </div>

                  {/* Telephony Diagram */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-bg-primary border border-border">
                      <div className="text-text-secondary text-[11px] font-medium">1. Carrier Inbound</div>
                      <div className="font-bold text-text-primary mt-1">Twilio DID Trunk</div>
                      <div className="text-[10px] text-text-secondary mt-0.5">&lt; 180ms latency response</div>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                      <div className="text-primary text-[11px] font-semibold">2. Speech AI Agent</div>
                      <div className="font-bold text-primary mt-1">Whisper + Nexlin LLM</div>
                      <div className="text-[10px] text-text-secondary mt-0.5">Zero-interruption streaming</div>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                      <div className="text-emerald-500 text-[11px] font-semibold">3. Autonomous Trigger</div>
                      <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-1">Auto-Book &amp; SMS Recap</div>
                      <div className="text-[10px] text-text-secondary mt-0.5">Direct calendar synchronization</div>
                    </div>
                  </div>

                  {/* Live Active Session Snippet */}
                  <div className="p-3.5 bg-bg-primary rounded-xl border border-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <div>
                        <div className="font-bold text-text-primary">+1 (415) 892-0192 <span className="font-normal text-text-secondary">• Apex Dynamics</span></div>
                        <div className="text-[11px] text-text-secondary">Qualifying for Enterprise SaaS • Active 01m 24s</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-primary bg-primary/10 border-primary/30">Live In Call</Badge>
                  </div>
                </div>
              )}

              {/* Tab 3: CPQ Proposals */}
              {activeHeroTab === "cpq" && (
                <div className="p-6 space-y-4 bg-bg-secondary/20">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-text-primary">CPQ Quote #1049</h4>
                        <Badge variant="outline" className="text-xs text-emerald-500 bg-emerald-500/10 border-emerald-500/30 font-semibold">
                          E-Signed &amp; Approved
                        </Badge>
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">Client: <strong>Cyberdyne Systems</strong> • Signed via Digital Portal</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-text-secondary">Total Contract Value</div>
                      <div className="text-lg font-extrabold text-primary">$48,000.00</div>
                    </div>
                  </div>

                  {/* Itemized Table */}
                  <div className="rounded-lg border border-border overflow-hidden bg-bg-primary text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-bg-secondary/80 border-b border-border text-text-secondary text-[11px]">
                        <tr>
                          <th className="p-2.5 font-semibold">Item &amp; Description</th>
                          <th className="p-2.5 text-center font-semibold">Term</th>
                          <th className="p-2.5 text-right font-semibold">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        <tr>
                          <td className="p-2.5 font-medium text-text-primary">Nexlin Enterprise Core (Multi-tenant White-label)</td>
                          <td className="p-2.5 text-center text-text-secondary">12 Mo</td>
                          <td className="p-2.5 text-right font-semibold">$30,000</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium text-text-primary">Voice AI Inbound Trunk (50,000 Minutes Block)</td>
                          <td className="p-2.5 text-center text-text-secondary">Annual</td>
                          <td className="p-2.5 text-right font-semibold">$12,000</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium text-text-primary">Dedicated Solutions Architect Onboarding</td>
                          <td className="p-2.5 text-center text-text-secondary">1-Time</td>
                          <td className="p-2.5 text-right font-semibold">$6,000</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Signature Stamp */}
                  <div className="p-3 bg-bg-primary rounded-xl border border-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">MD</div>
                      <div>
                        <div className="font-bold text-text-primary">Miles Dyson (Chief Architect)</div>
                        <div className="text-[10px] text-text-secondary">Verified Signature Hash: 0x8f2a...c4b1</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-emerald-500 bg-emerald-500/10 border-emerald-500/30">
                      ✓ Stripe Subscription Provisioned
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Laptop Bottom Lip / Notch */}
            <div className="pt-2 flex justify-center">
              <div className="w-20 h-1 rounded-full bg-slate-800 dark:bg-neutral-800" />
            </div>
          </motion.div>
        </section>

        {/* Live Metrics Counter Bar */}
        <section className="py-12 border-y border-border bg-bg-secondary/40">
          <div className="container mx-auto max-w-6xl px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-primary mb-1">0%</div>
              <div className="text-xs uppercase tracking-wider font-semibold text-text-secondary">BYOK Carrier Markup</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-text-primary mb-1">&lt; 200ms</div>
              <div className="text-xs uppercase tracking-wider font-semibold text-text-secondary">AI Voice Response</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-500 mb-1">99.8%</div>
              <div className="text-xs uppercase tracking-wider font-semibold text-text-secondary">Missed-Call Recovery</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-text-primary mb-1">100%</div>
              <div className="text-xs uppercase tracking-wider font-semibold text-text-secondary">White-Label Freedom</div>
            </div>
          </div>
        </section>

        {/* Signature Moment: Interactive Call Porter Visualizer */}
        <section id="call-porter" className="py-28 px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="outline" className="text-xs text-primary bg-primary/10 border-primary/20">
                Autonomous Telephony
              </Badge>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                Call Porter routing. <br />
                <span className="text-primary">Intelligent by default.</span>
              </h2>
              <p className="text-text-secondary text-base sm:text-lg leading-relaxed">
                Never lose a lead to a missed call. When a prospect calls, our AI receptionist answers instantly, qualifies the buyer, creates the CRM contact, moves the deal pipeline, and triggers instant SMS follow-ups.
              </p>
              <div className="space-y-3 text-sm font-medium">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Sub-second speech recognition with background noise cancellation</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Automatic B2B firmographic lead enrichment during the call</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Instant appointment booking synced to your Google / Outlook calendar</span>
                </div>
              </div>
            </div>

            {/* Interactive Step-by-Step Call Visualizer */}
            <div className="p-8 rounded-2xl bg-bg-secondary/40 border border-border shadow-xl relative overflow-hidden">
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border transition-all duration-300 ${callStep === 1 ? "bg-primary/10 border-primary shadow-md scale-[1.02]" : "bg-bg-primary border-border opacity-70"}`}>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="flex items-center gap-2"><PhoneCall className="w-4 h-4 text-blue-500" /> 1. Inbound Call Detected</span>
                    <span className="font-mono text-text-secondary">0.00s</span>
                  </div>
                  <p className="text-xs text-text-secondary">Caller ID: +1 (555) 839-2910 from San Francisco, CA</p>
                </div>

                <div className={`p-4 rounded-xl border transition-all duration-300 ${callStep === 2 ? "bg-primary/10 border-primary shadow-md scale-[1.02]" : "bg-bg-primary border-border opacity-70"}`}>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="flex items-center gap-2"><Bot className="w-4 h-4 text-primary" /> 2. AI Receptionist Qualifies Prospect</span>
                    <span className="font-mono text-text-secondary">0.18s</span>
                  </div>
                  <p className="text-xs text-text-secondary">AI captures budget ($25k), timeline (Next Month), and company size (50-200).</p>
                </div>

                <div className={`p-4 rounded-xl border transition-all duration-300 ${callStep === 3 ? "bg-primary/10 border-primary shadow-md scale-[1.02]" : "bg-bg-primary border-border opacity-70"}`}>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="flex items-center gap-2"><Kanban className="w-4 h-4 text-emerald-500" /> 3. CRM Deal & Contact Created</span>
                    <span className="font-mono text-text-secondary">0.42s</span>
                  </div>
                  <p className="text-xs text-text-secondary">Stage set to "Qualified Lead" • Rep auto-assigned via round-robin.</p>
                </div>

                <div className={`p-4 rounded-xl border transition-all duration-300 ${callStep === 4 ? "bg-primary/10 border-primary shadow-md scale-[1.02]" : "bg-bg-primary border-border opacity-70"}`}>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-purple-500" /> 4. Drip SMS & CPQ Proposal Dispatched</span>
                    <span className="font-mono text-text-secondary">1.02s</span>
                  </div>
                  <p className="text-xs text-text-secondary">Personalized text sent with merge tags: "Hi Sarah, here is your custom quote."</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Bento Grid */}
        <section id="features" className="py-28 px-4 sm:px-8 bg-bg-secondary/30 border-y border-border">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <Badge variant="outline" className="text-xs text-primary bg-primary/10">Full Stack Capabilities</Badge>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Everything you need to scale</h2>
              <p className="text-text-secondary text-base sm:text-lg">
                Engineered with strict enterprise architecture, zero data leakage, and lightning-fast Next.js server actions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <BentoCard
                icon={<Bot className="w-6 h-6 text-primary" />}
                title="AI-Native CRM & Sparring Coach"
                description="Visual Kanban pipelines, 1-click B2B firmographic enrichment, and interactive voice roleplay training for your sales reps."
              />
              <BentoCard
                icon={<FileText className="w-6 h-6 text-emerald-500" />}
                title="CPQ Proposals & E-Signatures"
                description="Generate contracts with customizable tier pricing, automatic tax calculation, and timing-safe digital signature verification."
              />
              <BentoCard
                icon={<Globe className="w-6 h-6 text-blue-500" />}
                title="Dual Global Payments"
                description="Accept global credit cards via Stripe and frictionless African mobile money / bank transfers via Paystack."
              />
              <BentoCard
                icon={<Zap className="w-6 h-6 text-purple-500" />}
                title="Event-Driven Drip Workflows"
                description="Inngest-powered workflow automation matrix with dynamic merge tags ({{contact.firstName}}), auto-assign reps, and webhook triggers."
              />
              <BentoCard
                icon={<Mail className="w-6 h-6 text-orange-500" />}
                title="2-Way Unified Omni-Inbox"
                description="Live multi-channel messaging across SMS, WhatsApp, and inbound email with real-time Pusher alerts and AI suggested SDR replies."
              />
              <BentoCard
                icon={<Shield className="w-6 h-6 text-red-500" />}
                title="100% White-Label SaaS Multi-Tenancy"
                description="Deploy custom CNAME domains with automated SSL provisioning, custom logos, brand color overrides, and sub-account isolation."
              />
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-28 px-4 sm:px-8 max-w-7xl mx-auto text-center">
          <div className="max-w-3xl mx-auto mb-12 space-y-4">
            <Badge variant="outline" className="text-xs text-primary bg-primary/10">Transparent Pricing</Badge>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Simple, predictable pricing</h2>
            <p className="text-text-secondary text-base sm:text-lg">No hidden carrier markups. Keep 100% of your software margins.</p>

            {/* Monthly / Annual Toggle */}
            <div className="inline-flex items-center gap-2 p-1.5 rounded-full bg-bg-secondary border border-border text-xs font-semibold mt-4">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-4 py-1.5 rounded-full transition-all ${billingPeriod === "monthly" ? "bg-primary text-white shadow-sm" : "text-text-secondary hover:text-text-primary"}`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingPeriod("annual")}
                className={`px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${billingPeriod === "annual" ? "bg-primary text-white shadow-sm" : "text-text-secondary hover:text-text-primary"}`}
              >
                <span>Annual Billing</span>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
            {/* Starter Tier */}
            <div className="p-8 rounded-2xl bg-bg-primary border border-border shadow-sm flex flex-col justify-between hover:border-primary/40 transition-colors">
              <div>
                <h3 className="text-xl font-bold">Starter Agency</h3>
                <p className="text-xs text-text-secondary mt-1 mb-6">For emerging agencies and solo founders.</p>
                <div className="text-4xl font-extrabold mb-6">
                  {billingPeriod === "annual" ? "$79" : "$97"}
                  <span className="text-sm font-normal text-text-secondary">/month</span>
                </div>
                <ul className="space-y-3 text-xs text-text-secondary">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Up to 3 Sub-Accounts</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Full CRM & Kanban Pipelines</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> 0% Markup Twilio BYOK</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Community Support</li>
                </ul>
              </div>
              <Link href="/register" className="mt-8">
                <Button variant="outline" className="w-full">Get Started</Button>
              </Link>
            </div>

            {/* Pro Tier (Recommended) */}
            <div className="p-8 rounded-2xl bg-bg-primary border-2 border-primary shadow-2xl flex flex-col justify-between relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-white text-[11px] font-bold uppercase tracking-wider shadow-md">
                Most Popular
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary">Pro Unlimited</h3>
                <p className="text-xs text-text-secondary mt-1 mb-6">For scaling agencies and software vendors.</p>
                <div className="text-4xl font-extrabold mb-6 text-text-primary">
                  {billingPeriod === "annual" ? "$239" : "$297"}
                  <span className="text-sm font-normal text-text-secondary">/month</span>
                </div>
                <ul className="space-y-3 text-xs text-text-primary font-medium">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Unlimited Sub-Accounts</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> 24/7 Autonomous Voice AI Receptionist</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> CPQ Proposals with E-Signatures</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> White-Label Custom Domains & SSL</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Priority SLA Support</li>
                </ul>
              </div>
              <Link href="/register" className="mt-8">
                <Button className="w-full font-bold shadow-lg shadow-primary/25">Start 14-Day Free Trial</Button>
              </Link>
            </div>

            {/* Enterprise Tier */}
            <div className="p-8 rounded-2xl bg-bg-primary border border-border shadow-sm flex flex-col justify-between hover:border-primary/40 transition-colors">
              <div>
                <h3 className="text-xl font-bold">Enterprise SaaS</h3>
                <p className="text-xs text-text-secondary mt-1 mb-6">For bespoke operations and SaaS platforms.</p>
                <div className="text-4xl font-extrabold mb-6">
                  Custom
                </div>
                <ul className="space-y-3 text-xs text-text-secondary">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Custom AI Model Fine-Tuning</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Dedicated Database Shards</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Custom ERP Integrations</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> 24/7 Dedicated Account Manager</li>
                </ul>
              </div>
              <Link href="/register" className="mt-8">
                <Button variant="outline" className="w-full">Contact Sales</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA Banner */}
        <section className="py-24 px-4 sm:px-8 max-w-5xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-tr from-primary/15 via-blue-500/10 to-purple-500/10 border border-primary/30 shadow-2xl relative overflow-hidden space-y-6">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Ready to modernize your business OS?
            </h2>
            <p className="text-text-secondary text-base sm:text-lg max-w-xl mx-auto">
              Join thousands of agencies switching to Nexlin. Set up your white-label platform in under 2 minutes.
            </p>
            <div className="pt-2">
              <Link href="/register">
                <Button size="lg" className="h-14 px-8 text-base font-bold shadow-xl shadow-primary/30">
                  Claim Your 14-Day Free Trial <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-bg-secondary/30 text-center text-xs text-text-secondary">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xs">N</div>
            <span className="font-bold text-text-primary text-sm">NEXLIN GHL</span>
          </div>
          <div>&copy; {new Date().getFullYear()} NEXLIN Inc. All rights reserved. Built for modern high-performance agencies.</div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:underline">Login</Link>
            <Link href="/register" className="hover:underline">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function BentoCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-8 rounded-2xl border border-border bg-bg-primary/90 shadow-sm hover:shadow-xl hover:border-primary/40 hover:-translate-y-1 transition-all duration-200 text-left space-y-3">
      <div className="p-3 rounded-xl bg-bg-secondary w-fit border border-border/80">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-text-primary">{title}</h3>
      <p className="text-xs text-text-secondary leading-relaxed">{description}</p>
    </div>
  )
}
