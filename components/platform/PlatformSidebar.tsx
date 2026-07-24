"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building, AppWindow, ShieldAlert, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

const routes = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    href: "/platform",
  },
  {
    label: "Tenants",
    icon: Building,
    href: "/platform/tenants",
  },
  {
    label: "Marketplace Apps",
    icon: AppWindow,
    href: "/platform/apps",
  },
  {
    label: "Administrators",
    icon: ShieldAlert,
    href: "/platform/admins",
  },
];

export function PlatformSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-bg-primary text-text-primary">
      <div className="h-16 flex items-center px-6 border-b border-border flex-shrink-0">
        <Link href="/platform" className="flex items-center gap-2 w-full">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <span className="font-bold tracking-tight text-primary truncate">Nexlin Admin</span>
        </Link>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {routes.map((route) => {
          const isActive = pathname === route.href;
          return (
            <Link
              key={route.href}
              href={route.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'}`}
            >
              <route.icon className="w-5 h-5" />
              {route.label}
            </Link>
          )
        })}
      </nav>
      
      <div className="p-4 border-t border-border flex-shrink-0">
        <button 
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium transition-colors text-text-secondary hover:bg-error/10 hover:text-error"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
