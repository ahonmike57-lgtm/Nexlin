"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { useRef } from "react"
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
  Bell,
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
  LayoutTemplate
} from "lucide-react"

const sidebarLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/crm/contacts", label: "Contacts", icon: Users },
  { href: "/crm/deals", label: "Pipeline", icon: Kanban },
  { href: "/chat", label: "Inbox", icon: MessageSquare },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/automations", label: "Automations", icon: Zap },
  { href: "/marketing/emails", label: "Email Marketing", icon: Mail },
  { href: "/affiliates", label: "Affiliate Manager", icon: Users },
  { href: "/social", label: "Social Planner", icon: Share2 },
  { href: "/ads", label: "Ads Manager", icon: Megaphone },
  { href: "/reputation", label: "Reputation", icon: Star },
  { href: "/websites", label: "Websites", icon: LayoutTemplate },
  { href: "/funnels", label: "Funnels", icon: Workflow },
  { href: "/forms", label: "Forms & Surveys", icon: FileSignature },
  { href: "/media", label: "Media Library", icon: FolderOpen },
  { href: "/marketplace", label: "App Marketplace", icon: Store },
  { href: "/reporting", label: "Reporting", icon: BarChart3 },
  { href: "/support", label: "Help Desk", icon: LifeBuoy },
  { href: "/support/knowledge-base", label: "Knowledge Base", icon: BookOpen },
  { href: "/voice", label: "Voice AI", icon: Mic },
  { href: "/settings", label: "Settings", icon: Settings },
]

export default function DashboardLayoutClient({ children, agency }: { children: ReactNode, agency?: any }) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const userName = session?.user?.name || "User"
  const userInitials = userName.substring(0, 2).toUpperCase()

  const platformName = agency?.whiteLabelName || agency?.name || "NEXLIN GHL"
  const platformLogo = agency?.logoUrl
  const brandInitial = platformName.substring(0, 1).toUpperCase()

  const sidebarRef = useRef<HTMLElement>(null)
  const linksRef = useRef<(HTMLAnchorElement | null)[]>([])
  
  useGSAP(() => {
    // Elegant slide-in for the sidebar
    gsap.from(sidebarRef.current, {
      x: -30,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      clearProps: "all"
    })

    // Stagger entry for navigation links
    gsap.from(linksRef.current, {
      x: -20,
      opacity: 0,
      duration: 0.5,
      stagger: 0.03,
      ease: "power2.out",
      delay: 0.2,
      clearProps: "all"
    })
  }, { scope: sidebarRef })

  return (
    <div className="flex h-screen bg-transparent overflow-hidden text-white/90 font-sans">
      {/* Sidebar */}
      <aside ref={sidebarRef} className="w-64 bg-[#0a0a0a]/80 backdrop-blur-xl border-r border-white/5 flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
        <div className="h-16 flex items-center px-6 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            {platformLogo ? (
              <img src={platformLogo} alt="Logo" className="max-h-8 object-contain" />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-xl">{brandInitial}</span>
              </div>
            )}
            {!platformLogo && <span className="font-bold tracking-tight text-primary truncate">{platformName}</span>}
          </div>
        </div>

        <div className="p-4 border-b border-white/5 flex-shrink-0">
          <SubAccountSwitcher />
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link, i) => {
            const isActive = pathname.startsWith(link.href)
            const Icon = link.icon
            
            return (
              <Link 
                key={link.href} 
                href={link.href}
                ref={(el) => { linksRef.current[i] = el }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 group overflow-hidden relative ${isActive ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.1)]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                onMouseEnter={(e) => {
                  gsap.to(e.currentTarget.querySelector('.nav-icon'), { 
                    scale: 1.1, 
                    rotate: 5, 
                    duration: 0.3, 
                    ease: "back.out(2)" 
                  })
                }}
                onMouseLeave={(e) => {
                  gsap.to(e.currentTarget.querySelector('.nav-icon'), { 
                    scale: 1, 
                    rotate: 0, 
                    duration: 0.3, 
                    ease: "power2.out" 
                  })
                }}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-primary rounded-r-full shadow-[0_0_10px_var(--color-primary)]" />
                )}
                <Icon className="w-5 h-5 nav-icon z-10" />
                <span className="z-10">{link.label}</span>
              </Link>
            )
          })}
        </nav>
        
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {userInitials}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{userName}</p>
                <p className="text-xs text-text-secondary truncate">{session?.user?.email || "Agency"}</p>
              </div>
            </div>
            <button 
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs font-medium text-text-secondary hover:text-error transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 z-10 relative">
        {/* Topbar */}
        <header className="h-16 bg-[#0a0a0a]/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-[50] relative">
          <div className="flex-1 max-w-md">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white/10 transition-all shadow-inner"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center text-text-secondary hover:text-primary transition-colors">
              <Mic className="w-5 h-5" />
            </button>
            <NotificationBell />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
