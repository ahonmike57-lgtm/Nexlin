"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Building, 
  AppWindow, 
  ShieldAlert, 
  Sliders, 
  LogOut, 
  Terminal,
  DollarSign,
  Cpu,
  Layers,
  Megaphone,
  LifeBuoy,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

type RouteItem = {
  label: string;
  icon: any;
  href: string;
  roles: Array<"owner" | "developer" | "support">;
};

const allRoutes: RouteItem[] = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    href: "/platform",
    roles: ["owner", "developer", "support"],
  },
  {
    label: "Tenants",
    icon: Building,
    href: "/platform/tenants",
    roles: ["owner", "developer", "support"],
  },
  {
    label: "Global Revenue & Billing",
    icon: DollarSign,
    href: "/platform/revenue",
    roles: ["owner"],
  },
  {
    label: "AI Usage & API Costs",
    icon: Cpu,
    href: "/platform/ai-usage",
    roles: ["owner", "developer"],
  },
  {
    label: "Marketplace Apps",
    icon: AppWindow,
    href: "/platform/apps",
    roles: ["owner", "developer"],
  },
  {
    label: "Blueprint Snapshots",
    icon: Layers,
    href: "/platform/snapshots",
    roles: ["owner", "developer"],
  },
  {
    label: "Feature Flags",
    icon: Sliders,
    href: "/platform/features",
    roles: ["owner", "developer"],
  },
  {
    label: "Global Announcements",
    icon: Megaphone,
    href: "/platform/announcements",
    roles: ["owner", "developer", "support"],
  },
  {
    label: "Support Ticket Queue",
    icon: LifeBuoy,
    href: "/platform/support",
    roles: ["owner", "developer", "support"],
  },
  {
    label: "System Debug & Logs",
    icon: Terminal,
    href: "/platform/debug",
    roles: ["owner", "developer"],
  },
  {
    label: "Platform Audit Logs",
    icon: ShieldCheck,
    href: "/platform/audit-logs",
    roles: ["owner", "developer"],
  },
  {
    label: "Administrators",
    icon: ShieldAlert,
    href: "/platform/admins",
    roles: ["owner"],
  },
  {
    label: "Prospecting Scanner",
    icon: Building,
    href: "/platform/prospecting",
    roles: ["owner", "developer", "support"],
  },
];

export function PlatformSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Get raw role and normalize (default to "owner" if full super admin)
  const userRole = ((session?.user as any)?.role || "owner").toLowerCase() as "owner" | "developer" | "support";

  // Filter accessible routes according to Admin Role
  const filteredRoutes = allRoutes.filter((route) => {
    if (userRole === "owner") return true; // Owner has unrestricted access
    return route.roles.includes(userRole);
  });

  return (
    <div className="flex flex-col h-full bg-bg-primary text-text-primary">
      <div className="h-16 flex items-center justify-between px-6 border-b border-border flex-shrink-0">
        <Link href="/platform" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <span className="font-bold tracking-tight text-primary truncate">Nexlin Admin</span>
        </Link>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
          userRole === "owner" ? "bg-primary/10 text-primary" :
          userRole === "developer" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
          "bg-blue-500/10 text-blue-600 dark:text-blue-400"
        }`}>
          {userRole}
        </span>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredRoutes.map((route) => {
          const isActive = pathname === route.href;
          return (
            <Link
              key={route.href}
              href={route.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
              }`}
            >
              <route.icon className="w-4 h-4" />
              <span className="truncate">{route.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border flex-shrink-0">
        <div className="px-3 py-2 mb-2 flex items-center gap-2 text-xs text-text-secondary">
          <UserCheck className="w-4 h-4 text-emerald-500" />
          <span className="truncate">{session?.user?.email || "Super Admin"}</span>
        </div>
        <button 
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium transition-colors text-text-secondary hover:bg-error/10 hover:text-error"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
