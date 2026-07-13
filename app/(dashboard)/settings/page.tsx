"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Palette, Globe, CreditCard, Link as LinkIcon, Building, ShieldCheck, Mail, Save, Settings2 } from "lucide-react"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general")

  const tabs = [
    { id: "general", label: "General", icon: Building },
    { id: "whitelabel", label: "White-Label", icon: Palette },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "integrations", label: "Integrations", icon: LinkIcon },
    { id: "domains", label: "Domains", icon: Globe },
    { id: "security", label: "Security", icon: ShieldCheck },
  ]

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-text-secondary">Manage your agency preferences and integrations.</p>
        </div>
        <Button><Save className="w-4 h-4 mr-2" /> Save Changes</Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0 lg:overflow-y-auto pr-2">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-4 lg:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "domains") {
                    window.location.href = "/settings/domains";
                    return;
                  }
                  setActiveTab(tab.id)
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-bg-primary shadow-sm border border-border text-primary' : 'text-text-secondary hover:bg-bg-primary/50 hover:text-text-primary border border-transparent'}`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pb-8">
          {activeTab === "whitelabel" && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-2xl font-semibold mb-1">White-Label Configuration</h2>
                <p className="text-text-secondary">Make the platform completely yours.</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Brand Assets</CardTitle>
                  <CardDescription>Upload your logo and favicon.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Main Logo (Light Mode)</label>
                      <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-bg-secondary transition-colors cursor-pointer bg-bg-secondary/50">
                        <Palette className="w-6 h-6 mx-auto text-text-secondary mb-2" />
                        <span className="text-xs text-text-secondary">Upload PNG er.svg</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Favicon</label>
                      <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-bg-secondary transition-colors cursor-pointer bg-bg-secondary/50">
                        <Globe className="w-6 h-6 mx-auto text-text-secondary mb-2" />
                        <span className="text-xs text-text-secondary">Upload .ico or .png</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Brand Colors</CardTitle>
                  <CardDescription>These colors will replace the default platform colors.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Primary Color</label>
                      <div className="flex gap-3">
                        <Input type="color" defaultValue="#1A3CFF" className="w-12 h-10 p-1 cursor-pointer" />
                        <Input defaultValue="#1A3CFF" className="flex-1 font-mono" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Secondary Color</label>
                      <div className="flex gap-3">
                        <Input type="color" defaultValue="#6E1AFF" className="w-12 h-10 p-1 cursor-pointer" />
                        <Input defaultValue="#6E1AFF" className="flex-1 font-mono" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Email Settings</CardTitle>
                  <CardDescription>Configure the sender details for automated platform emails.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sender Name</label>
                    <Input defaultValue="Acme Support" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sender Email Address</label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-text-secondary absolute ml-3" />
                      <Input defaultValue="support@acmecorp.com" className="pl-9" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg text-warning text-sm">
                    <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                    <p>DNS verification is required to send emails from your domain. Check the Domains tab.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-2xl font-semibold mb-1">Dual Global Payments</h2>
                <p className="text-text-secondary">Configure your payment gateways for seamless global collection.</p>
              </div>

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
                  <CardDescription>Automatically routed for clients in African markets (Nigeria, Ghana, South Africa, etc.).</CardDescription>
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

              <Card>
                <CardHeader>
                  <CardTitle>Billing Settings</CardTitle>
                  <CardDescription>How you charge your clients.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
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
          )}

          {activeTab !== "whitelabel" && activeTab !== "payments" && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mb-4">
                <Settings2 className="w-8 h-8 text-text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">This section is under construction</h3>
              <p className="text-text-secondary max-w-sm">We are building out the {tabs.find(t => t.id === activeTab)?.label} settings for Phase 1.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
