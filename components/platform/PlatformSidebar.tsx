"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building, AppWindow, ShieldAlert, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
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
    <div className="space-y-4 py-4 flex flex-col h-full bg-slate-950 text-white">
      <div className="px-3 py-2 flex-1">
        <Link href="/platform" className="flex items-center pl-3 mb-14">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Nexlin <span className="text-primary text-blue-500">Admin</span>
          </h1>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                pathname === route.href ? "text-white bg-white/10" : "text-zinc-400"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", pathname === route.href ? "text-blue-500" : "text-zinc-400")} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      <div className="px-3 py-2 mt-auto">
         <button 
           onClick={() => signOut({ callbackUrl: "/login" })}
           className="text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition text-zinc-400"
         >
           <div className="flex items-center flex-1">
             <LogOut className="h-5 w-5 mr-3 text-zinc-400" />
             Sign Out
           </div>
         </button>
      </div>
    </div>
  );
}
