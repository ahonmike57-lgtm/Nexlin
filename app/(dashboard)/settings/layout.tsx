"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Palette, Globe, CreditCard, Link as LinkIcon, Building, ShieldCheck, Save, Users, Phone, Cpu, GitBranch, Settings } from "lucide-react"

const tabs = [
  { id: "general", href: "/settings", label: "General", icon: Settings, exact: true },
  { id: "snapshots", href: "/settings/snapshots", label: "Snapshots", icon: GitBranch }, // New Snapshots tab
  { id: "sub-accounts", href: "/settings/sub-accounts", label: "Sub-Accounts", icon: Building },
  { id: "team", href: "/settings/team", label: "Team", icon: Users },
  { id: "billing", href: "/settings/billing", label: "Billing", icon: CreditCard },
  { id: "branding", href: "/settings/branding", label: "Branding", icon: Palette },
  { id: "integrations", href: "/settings/integrations", label: "Integrations", icon: LinkIcon },
  { id: "domains", href: "/settings/domains", label: "Domains", icon: Globe },
  { id: "phone-numbers", href: "/settings/phone-numbers", label: "Phone Numbers", icon: Phone },
  { id: "pipelines", href: "/settings/pipelines", label: "Pipelines", icon: GitBranch },
  { id: "mcp", href: "/settings/mcp", label: "MCP Connections", icon: Cpu },
  { id: "security", href: "/settings/security", label: "Security", icon: ShieldCheck },
]

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="h-full flex flex-col">
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
            {tabs.map((tab) => {
              const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)
              
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${isActive ? 'bg-bg-primary shadow-sm border border-border text-primary' : 'text-text-secondary hover:bg-bg-primary/50 hover:text-text-primary border border-transparent'}`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pb-8">
          {children}
        </div>
      </div>
    </div>
  )
}
