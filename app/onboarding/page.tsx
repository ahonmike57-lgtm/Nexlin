"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { Building2, Users, Link as LinkIcon, Palette, CheckCircle2 } from "lucide-react"

const steps = [
  { id: "business", title: "Business Info", icon: Building2 },
  { id: "team", title: "Team Setup", icon: Users },
  { id: "integrations", title: "Integrations", icon: LinkIcon },
  { id: "branding", title: "Branding", icon: Palette },
]

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(curr => curr + 1)
    } else {
      setIsCompleted(true)
      // Redirect to dashboard in real implementation
      setTimeout(() => window.location.href = "/dashboard", 2000)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(curr => curr - 1)
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
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300 ${isActive || isPast ? 'bg-primary text-white' : 'bg-bg-primary border border-border text-text-secondary'}`}>
                  <StepIcon className="w-5 h-5" />
                </div>
                <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-text-secondary'}`}>{step.title}</span>
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
                      <label className="text-sm font-medium">Business Name</label>
                      <Input placeholder="Acme Corp" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Industry</label>
                      <select className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                        <option>Digital Agency</option>
                        <option>E-Commerce</option>
                        <option>Real Estate</option>
                        <option>SaaS</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Invite your team</h2>
                    <p className="text-text-secondary">Collaboration makes everything better.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input placeholder="colleague@company.com" className="flex-1" />
                      <Button variant="secondary">Send Invite</Button>
                    </div>
                    <div className="flex gap-2">
                      <Input placeholder="another@company.com" className="flex-1" />
                      <Button variant="secondary">Send Invite</Button>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Connect your tools</h2>
                    <p className="text-text-secondary">Sync your data automatically.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#635BFF] text-white rounded-lg flex items-center justify-center font-bold">S</div>
                        <div>
                          <h4 className="font-semibold">Stripe</h4>
                          <p className="text-xs text-text-secondary">Global Payments</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Connect</Button>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#0BA4DB] text-white rounded-lg flex items-center justify-center font-bold">P</div>
                        <div>
                          <h4 className="font-semibold">Paystack</h4>
                          <p className="text-xs text-text-secondary">African Payments</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Connect</Button>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Make it yours</h2>
                    <p className="text-text-secondary">Set up your brand colors and logo.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Primary Brand Color</label>
                      <div className="flex gap-4">
                        <Input type="color" defaultValue="#1A3CFF" className="w-16 h-10 p-1" />
                        <Input defaultValue="#1A3CFF" className="flex-1" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Upload Logo</label>
                      <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-bg-secondary transition-colors cursor-pointer">
                        <Palette className="w-8 h-8 mx-auto text-text-secondary mb-2" />
                        <p className="text-sm text-text-secondary">Click to upload or drag and drop</p>
                      </div>
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
            <Button onClick={handleNext}>
              {currentStep === steps.length - 1 ? "Complete Setup" : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
