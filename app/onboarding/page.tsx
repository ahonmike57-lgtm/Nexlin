"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { Building2, Users, Link as LinkIcon, Palette, CheckCircle2, ExternalLink, Check } from "lucide-react"

import { completeOnboarding } from "@/app/actions/onboarding"
import { inviteTeamMember } from "@/app/actions/settings"
import { toast } from "sonner"

const steps = [
  { id: "business", title: "Business Info", icon: Building2 },
  { id: "team", title: "Team Setup", icon: Users },
  { id: "integrations", title: "Integrations", icon: LinkIcon },
  { id: "branding", title: "Branding", icon: Palette },
]

export default function OnboardingWizard() {
  const { update } = useSession()
  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step 1: Business Info
  const [businessName, setBusinessName] = useState("")
  const [industry, setIndustry] = useState("Digital Agency")
  const [timezone, setTimezone] = useState("UTC")

  // Step 2: Team Setup (queued and dispatched once workspace is created)
  const [inviteEmail1, setInviteEmail1] = useState("")
  const [inviteEmail2, setInviteEmail2] = useState("")
  const [queuedInvites, setQueuedInvites] = useState<string[]>([])

  // Step 4: Branding
  const [primaryColor, setPrimaryColor] = useState("#1A3CFF")

  const queueInvite = (rawEmail: string, clearFn: (v: string) => void) => {
    const clean = rawEmail.trim().toLowerCase()
    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      toast.error("Please enter a valid colleague email address")
      return
    }
    if (queuedInvites.includes(clean)) {
      toast.info(`${clean} is already queued`)
      return
    }
    setQueuedInvites((prev) => [...prev, clean])
    clearFn("")
    toast.success(`Queued invite for ${clean}`)
  }

  const handleNext = async () => {
    if (currentStep === 0 && !businessName.trim()) {
      toast.error("Please enter a business name")
      return
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((curr) => curr + 1)
      return
    }

    setIsSubmitting(true)
    const res = await completeOnboarding({
      businessName,
      industry,
      timezone,
      primaryColor,
    })

    if (!res.success) {
      toast.error(res.error || "Failed to complete onboarding")
      setIsSubmitting(false)
      return
    }

    // Refresh the JWT session so agencyId/role take effect immediately without re-login
    await update({ refreshTenant: true }).catch(() => {})

    // Send any queued team invites now that the workspace and session agencyId exist
    for (const email of queuedInvites) {
      await inviteTeamMember(email, "Team Member").catch(() => {})
    }

    setIsCompleted(true)
    setTimeout(() => {
      window.location.href = "/dashboard"
    }, 1200)
  }

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((curr) => curr - 1)
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-secondary p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-bg-primary p-12 rounded-2xl shadow-soft text-center max-w-md w-full"
        >
          <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold mb-4">You&apos;re all set!</h2>
          <p className="text-text-secondary mb-8">Preparing your workspace...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-secondary flex flex-col">
      <header className="h-16 bg-bg-primary border-b border-border flex items-center px-8">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-primary">NEXLIN GHL</span>
        </div>
      </header>

      <div className="flex-1 max-w-3xl w-full mx-auto p-8 py-12">
        {/* Progress Bar */}
        <div className="mb-12 flex justify-between relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-border -z-10 -translate-y-1/2"></div>
          <div
            className="absolute top-1/2 left-0 h-1 bg-primary -z-10 -translate-y-1/2 transition-all duration-500 ease-in-out"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          ></div>

          {steps.map((step, idx) => {
            const StepIcon = step.icon
            const isActive = idx === currentStep
            const isPast = idx < currentStep

            return (
              <div key={step.id} className="flex flex-col items-center gap-2">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300 ${
                    isActive || isPast
                      ? "bg-primary text-white"
                      : "bg-bg-primary border border-border text-text-secondary"
                  }`}
                >
                  <StepIcon className="w-5 h-5" />
                </div>
                <span className={`text-xs font-medium ${isActive ? "text-primary" : "text-text-secondary"}`}>
                  {step.title}
                </span>
              </div>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="bg-bg-primary rounded-2xl shadow-soft p-8 min-h-[400px] flex flex-col relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1"
            >
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Tell us about your business</h2>
                    <p className="text-text-secondary">This helps us customize your workspace.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Business Name <span className="text-destructive">*</span>
                      </label>
                      <Input
                        placeholder="Acme Agency"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Industry</label>
                      <select
                        className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                      >
                        <option value="Digital Agency">Digital Agency</option>
                        <option value="E-Commerce">E-Commerce</option>
                        <option value="Real Estate">Real Estate</option>
                        <option value="SaaS">SaaS</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Timezone</label>
                      <select
                        className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                      >
                        <option value="UTC">UTC (GMT+0)</option>
                        <option value="EST">Eastern Time (EST/EDT)</option>
                        <option value="CST">Central Time (CST/CDT)</option>
                        <option value="MST">Mountain Time (MST/MDT)</option>
                        <option value="PST">Pacific Time (PST/PDT)</option>
                        <option value="GMT">Greenwich Mean Time (GMT)</option>
                        <option value="CET">Central European Time (CET)</option>
                        <option value="IST">Indian Standard Time (IST)</option>
                        <option value="AEST">Australian Eastern Standard Time (AEST)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Invite your team</h2>
                    <p className="text-text-secondary">
                      Queue teammates to join your workspace as soon as setup completes.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="colleague@company.com"
                        className="flex-1"
                        value={inviteEmail1}
                        onChange={(e) => setInviteEmail1(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => queueInvite(inviteEmail1, setInviteEmail1)}
                      >
                        Send Invite
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="another@company.com"
                        className="flex-1"
                        value={inviteEmail2}
                        onChange={(e) => setInviteEmail2(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => queueInvite(inviteEmail2, setInviteEmail2)}
                      >
                        Send Invite
                      </Button>
                    </div>
                    {queuedInvites.length > 0 && (
                      <div className="pt-2 space-y-1.5">
                        <p className="text-xs font-medium text-text-secondary uppercase">Queued Team Invites</p>
                        <div className="flex flex-wrap gap-2">
                          {queuedInvites.map((email) => (
                            <span
                              key={email}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                            >
                              <Check className="w-3 h-3" /> {email}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Connect your tools</h2>
                    <p className="text-text-secondary">
                      Open payment or integration settings after finishing setup, or configure them right now in a new tab.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#635BFF] text-white rounded-lg flex items-center justify-center font-bold">
                          S
                        </div>
                        <div>
                          <h4 className="font-semibold">Stripe</h4>
                          <p className="text-xs text-text-secondary">Global Payments</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open("/settings/billing", "_blank")}
                        className="gap-1.5"
                      >
                        Connect <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#0BA4DB] text-white rounded-lg flex items-center justify-center font-bold">
                          P
                        </div>
                        <div>
                          <h4 className="font-semibold">Paystack & Channels</h4>
                          <p className="text-xs text-text-secondary">African Payments & Messaging</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open("/settings/integrations", "_blank")}
                        className="gap-1.5"
                      >
                        Connect <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Make it yours</h2>
                    <p className="text-text-secondary">Set up your primary brand color now; full branding tools await in Settings.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Primary Brand Color</label>
                      <div className="flex gap-4">
                        <Input
                          type="color"
                          value={/^#[0-9a-fA-F]{6}$/.test(primaryColor) ? primaryColor : "#1A3CFF"}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          placeholder="#1A3CFF"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="p-4 border border-border rounded-xl bg-bg-secondary/40 text-xs text-text-secondary">
                      Custom logos, white-label domains, and email headers can be uploaded anytime in{" "}
                      <span className="font-medium text-text-primary">Settings → Branding</span> once your workspace is ready.
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="pt-8 mt-auto flex justify-between border-t border-border">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              className={currentStep ? "" : "opacity-0 pointer-events-none"}
            >
              Back
            </Button>
            <Button onClick={handleNext} disabled={isSubmitting}>
              {currentStep === steps.length - 1
                ? isSubmitting
                  ? "Setting up..."
                  : "Complete Setup"
                : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
