"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building, AppWindow, ShieldAlert, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

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
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(".sidebar-item", {
      x: -20,
      opacity: 0,
      duration: 0.5,
      stagger: 0.05,
      ease: "power2.out",
      delay: 0.1
    });
  }, { scope: container });

  return (
    <div ref={container} className="space-y-4 py-4 flex flex-col h-full bg-transparent text-zinc-100">
      <div className="px-4 py-2 flex-1">
        <Link href="/platform" className="sidebar-item flex items-center pl-2 mb-12 group">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(var(--primary),0.5)] group-hover:shadow-[0_0_25px_rgba(var(--primary),0.8)] transition-all">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100 group-hover:text-white transition-colors">
            Nexlin <span className="text-primary text-blue-400 font-normal">Admin</span>
          </h1>
        </Link>
        <div className="space-y-2">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "sidebar-item text-sm group flex p-3 w-full justify-start font-medium cursor-pointer rounded-xl transition-all duration-200 relative overflow-hidden",
                pathname === route.href 
                  ? "text-white bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" 
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              {pathname === route.href && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
              )}
              <div className="flex items-center flex-1 relative z-10">
                <route.icon className={cn("h-5 w-5 mr-3 transition-colors", pathname === route.href ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-300")} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      <div className="px-4 py-4 mt-auto border-t border-white/5">
         <button 
           onClick={() => signOut({ callbackUrl: "/login" })}
           className="sidebar-item text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/5 rounded-xl transition-all text-zinc-400"
         >
           <div className="flex items-center flex-1">
             <LogOut className="h-5 w-5 mr-3 text-zinc-500 group-hover:text-red-400 transition-colors" />
             <span className="group-hover:text-red-400 transition-colors">Sign Out</span>
           </div>
         </button>
      </div>
    </div>
  );
}
