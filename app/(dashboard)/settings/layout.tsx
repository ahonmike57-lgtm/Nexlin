"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Palette, Globe, CreditCard, Link as LinkIcon, Building2,
  ShieldCheck, Users, Phone, Settings, Sparkles, Key, FileText
} from "lucide-react"

type SettingsNavGroup = {
  title: string
  items: {
    id: string
    href: string
    label: string
    icon: React.ElementType
    exact?: boolean
  }[]
}

const settingsGroups: SettingsNavGroup[] = [
  {
    title: "Agency & Workspace",
    items: [
      { id: "general", href: "/settings", label: "General Profile", icon: Settings, exact: true },
      { id: "branding", href: "/settings/branding", label: "Branding & Theme", icon: Palette },
      { id: "sub-accounts", href: "/settings/sub-accounts", label: "Sub-Accounts", icon: Building2 },
      { id: "team", href: "/settings/team", label: "Team & Staff", icon: Users },
    ]
  },
  {
    title: "Billing & Plans",
    items: [
      { id: "billing", href: "/settings/billing", label: "Subscription Billing", icon: CreditCard },
      { id: "saas", href: "/settings/saas", label: "SaaS Mode Config", icon: Sparkles },
    ]
  },
  {
    title: "Automations & Developer",
    items: [
      { id: "trigger-links", href: "/settings/trigger-links", label: "Trigger Links & Tracking", icon: LinkIcon },
      { id: "custom-menu", href: "/settings/custom-menu", label: "Custom Menu Links", icon: Globe },
      { id: "integrations", href: "/settings/integrations", label: "Integrations & Webhooks", icon: LinkIcon },
      { id: "api-keys", href: "/settings/api-keys", label: "Developer & API Keys", icon: Key },
    ]
  },
  {
    title: "Channels & Connectivity",
    items: [
      { id: "domains", href: "/settings/domains", label: "Domains & SSL", icon: Globe },
      { id: "phone-numbers", href: "/settings/phone-numbers", label: "Phone Numbers", icon: Phone },
    ]
  },
  {
    title: "Security & Governance",
    items: [
      { id: "security", href: "/settings/security", label: "Security & 2FA", icon: ShieldCheck },
      { id: "audit-logs", href: "/settings/audit-logs", label: "Audit Logs", icon: FileText },
    ]
  }
]

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-text-secondary mt-1">Manage your agency preferences, integrations, billing, and developer tools.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 overflow-hidden">
        {/* Categorized Navigation Sidebar */}
        <div className="w-full lg:w-68 flex-shrink-0 lg:overflow-y-auto pr-3 custom-scrollbar">
          <nav className="space-y-6">
            {settingsGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-secondary/70 px-3 mb-2">
                  {group.title}
                </h3>
                <div className="space-y-0.5">
                  {group.items.map((tab) => {
                    const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)
                    const Icon = tab.icon

                    return (
                      <Link
                        key={tab.id}
                        href={tab.href}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? "bg-primary text-white shadow-sm shadow-primary/25 font-bold"
                            : "text-text-secondary hover:bg-bg-primary hover:text-text-primary"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-text-secondary"}`} />
                        <span>{tab.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pb-12 pr-1 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  )
}
