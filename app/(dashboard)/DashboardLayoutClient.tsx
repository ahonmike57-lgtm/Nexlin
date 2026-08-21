"use client"

import { ReactNode, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import SubAccountSwitcher from "@/components/SubAccountSwitcher"
import NotificationBell from "@/components/ui/notification-bell"
import {
  LayoutDashboard,
  Users,
  Kanban,
  MessageSquare,
  LifeBuoy,
  Workflow,
  Settings,
  Mic,
  Search,
  Mail,
  Calendar,
  Zap,
  BarChart3,
  Share2,
  Megaphone,
  BookOpen,
  Star,
  FileSignature,
  FolderOpen,
  Store,
  LayoutTemplate,
  Sparkles,
  FileText,
  GitMerge,
  Code2,
  Globe,
  Bot,
  Library,
  PenLine,
  PhoneMissed,
  PhoneCall,
  ChevronDown,
  ChevronRight
} from "lucide-react"

type SidebarLink = {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
}

type SidebarSection = {
  title: string
  items: SidebarLink[]
  defaultOpen?: boolean
}

const sidebarSections: SidebarSection[] = [
  {
    title: "Overview",
    defaultOpen: true,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/chat", label: "Conversations", icon: MessageSquare },
      { href: "/calendar", label: "Calendars", icon: Calendar },
      { href: "/reporting", label: "Reporting & Analytics", icon: BarChart3 },
    ]
  },
  {
    title: "CRM & Sales",
    defaultOpen: true,
    items: [
      { href: "/crm/contacts", label: "Contacts & Smart Lists", icon: Users },
      { href: "/crm/deals", label: "Pipelines & Deals", icon: Kanban },
      { href: "/crm/invoices", label: "Payments & Invoices", icon: FileText },
      { href: "/crm/roleplay", label: "Sales AI Roleplay", icon: Bot },
    ]
  },
  {
    title: "Marketing & Reach",
    defaultOpen: true,
    items: [
      { href: "/automations", label: "Automations", icon: Zap },
      { href: "/marketing/emails", label: "Email Marketing", icon: Mail },
      { href: "/social", label: "Social Planner", icon: Share2 },
      { href: "/ads", label: "Ads Manager", icon: Megaphone },
      { href: "/reputation", label: "Reputation & Reviews", icon: Star },
      { href: "/affiliates", label: "Affiliate Manager", icon: Users },
    ]
  },
  {
    title: "Sites & Assets",
    defaultOpen: false,
    items: [
      { href: "/funnels", label: "Funnels & Websites", icon: Workflow },
      { href: "/forms", label: "Forms & Surveys", icon: FileSignature },
      { href: "/media", label: "Media Library", icon: FolderOpen },
      { href: "/forge", label: "Forge AI Builder", icon: Sparkles },
    ]
  },
  {
    title: "Voice & Apps",
    defaultOpen: false,
    items: [
      { href: "/voice", label: "Voice AI", icon: Mic },
      { href: "/marketplace", label: "App Marketplace", icon: Store },
      { href: "/support", label: "Help Desk & Support", icon: LifeBuoy },
    ]
  },
  {
    title: "System",
    defaultOpen: false,
    items: [
      { href: "/settings", label: "Agency Settings", icon: Settings },
    ]
  }
]

const LINK_FEATURE_MAP: Record<string, string> = {
  "/affiliates": "affiliate_manager",
  "/social": "social_planner",
  "/ads": "ads_manager",
  "/reputation": "reputation",
  "/marketplace": "mcp_integrations",
  "/voice": "voice_ai",
}

import { AskAiCommandBar } from "@/components/AskAiCommandBar"
import { OmniChatDrawer } from "@/components/OmniChatDrawer"

export default function DashboardLayoutClient({
  children,
  agency,
  featureFlags = []
}: {
  children: ReactNode
  agency?: any
  featureFlags?: any[]
}) {
  const pathname = usePathname()
  const { data: session } = useSession()

  // Track collapsed/expanded sections (auto-expand section if it contains the active route)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {}
    sidebarSections.forEach((sec) => {
      const containsActive = sec.items.some((item) =>
        item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/")
      )
      // Open if it contains the active route or if defaultOpen is true
      initialState[sec.title] = containsActive ? false : !sec.defaultOpen
    })
    return initialState
  })

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  const userName = session?.user?.name || "User"
  const userInitials = userName.substring(0, 2).toUpperCase()

  const platformName = agency?.whiteLabelName || agency?.name || "NEXLIN GHL"
  const platformLogo = agency?.logoUrl
  const brandInitial = platformName.substring(0, 1).toUpperCase()
  const agencyTier = (agency?.planTier || "basic").toLowerCase()

  return (
    <div className="flex h-screen bg-bg-secondary overflow-hidden text-text-primary">
      {/* Sidebar */}
      <aside className="w-64 bg-bg-primary border-r border-border flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {platformLogo ? (
              <img src={platformLogo} alt="Logo" className="max-h-8 object-contain" />
            ) : (
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
                <span className="text-white font-bold text-lg">{brandInitial}</span>
              </div>
            )}
            <span className="font-extrabold tracking-tight text-text-primary text-base truncate">
              {platformName}
            </span>
          </div>
        </div>

        {/* Sub-Account Switcher */}
        <div className="p-3 border-b border-border flex-shrink-0 bg-bg-secondary/30">
          <SubAccountSwitcher />
        </div>

        {/* Grouped Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto custom-scrollbar">
          {sidebarSections.map((section) => {
            const isCollapsed = collapsedSections[section.title]
            const containsActive = section.items.some((item) =>
              item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + "/")
            )

            return (
              <div key={section.title} className="space-y-1">
                {/* Section Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-text-secondary/80 hover:text-text-primary transition-colors group"
                >
                  <span className={containsActive ? "text-primary font-extrabold" : ""}>
                    {section.title}
                  </span>
                  <div className="text-text-secondary/60 group-hover:text-text-primary">
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </button>

                {/* Section Links */}
                {!isCollapsed && (
                  <div className="space-y-0.5 animate-in fade-in duration-150">
                    {section.items.map((link) => {
                      const featureKey = LINK_FEATURE_MAP[link.href]
                      const flag = featureFlags.find((f: any) => f.key === featureKey)

                      if (flag && !flag.isEnabledGlobal) {
                        return null
                      }

                      const allowedTiers = flag?.enabledTiers
                        ? flag.enabledTiers.split(",").map((t: string) => t.trim().toLowerCase())
                        : []
                      const isTierLocked =
                        flag && allowedTiers.length > 0 && !allowedTiers.includes(agencyTier)

                      const isActive = link.exact
                        ? pathname === link.href
                        : pathname === link.href || pathname.startsWith(link.href + "/")

                      const Icon = link.icon

                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isActive
                              ? "bg-primary text-white font-semibold shadow-sm shadow-primary/25"
                              : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-text-secondary"}`} />
                            <span className="truncate">{link.label}</span>
                          </div>
                          {isTierLocked && (
                            <span
                              className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded border ${
                                isActive
                                  ? "bg-white/20 text-white border-white/30"
                                  : "bg-primary/10 text-primary border-primary/20"
                              }`}
                            >
                              Pro
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-border bg-bg-secondary/40 flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                {userInitials}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold truncate text-text-primary">{userName}</p>
                <p className="text-[10px] text-text-secondary truncate">{session?.user?.email || "Agency"}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-[11px] font-semibold text-text-secondary hover:text-red-500 transition-colors shrink-0 px-1"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-bg-primary border-b border-border flex items-center justify-between px-6 z-[50] relative">
          <div className="flex-1 max-w-lg flex items-center">
            <AskAiCommandBar />
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>

        {/* Global Omni-Inbox Floating Drawer */}
        <OmniChatDrawer />
      </div>
    </div>
  )
}
