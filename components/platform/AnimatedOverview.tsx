"use client";

import React, { useRef } from "react";
import { Building, AppWindow, ShieldAlert, TrendingUp } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface AnimatedOverviewProps {
  data: {
    totalTenants: number;
    activeTenants: number;
    appInstalls: number;
    admins: number;
  };
}

export function AnimatedOverview({ data }: AnimatedOverviewProps) {
  const container = useRef<HTMLDivElement>(null);

  const kpis = [
    {
      title: "Total Tenants",
      value: data.totalTenants,
      icon: Building,
      description: "Total agencies registered",
      trend: "+12% this month"
    },
    {
      title: "Active Tenants",
      value: data.activeTenants,
      icon: TrendingUp,
      description: "Agencies actively using the platform",
      trend: "+8% this month"
    },
    {
      title: "App Installs",
      value: data.appInstalls,
      icon: AppWindow,
      description: "Total marketplace apps installed",
      trend: "+24% this month"
    },
    {
      title: "Platform Admins",
      value: data.admins,
      icon: ShieldAlert,
      description: "Users with platform access",
      trend: "Stable"
    }
  ];

  useGSAP(() => {
    gsap.from(".header-element", {
      y: 20,
      duration: 0.6,
      stagger: 0.1,
      ease: "power3.out"
    });

    gsap.from(".kpi-card", {
      y: 40,
      duration: 0.8,
      stagger: 0.1,
      ease: "power3.out",
      delay: 0.2
    });

    // Magnetic/Floating hover effect for cards
    gsap.utils.toArray('.kpi-card').forEach((card: any) => {
      const hoverTl = gsap.timeline({ paused: true });
      hoverTl.to(card, {
        y: -5,
        boxShadow: "0 20px 40px -10px rgba(0,0,0,0.3)",
        borderColor: "rgba(255,255,255,0.15)",
        duration: 0.4,
        ease: "power2.out"
      });
      
      const icon = card.querySelector('.kpi-icon');
      if (icon) {
        hoverTl.to(icon, {
          color: "#fff",
          scale: 1.1,
          duration: 0.3,
          ease: "power2.out"
        }, 0);
      }

      card.addEventListener("mouseenter", () => hoverTl.play());
      card.addEventListener("mouseleave", () => hoverTl.reverse());
    });

  }, { scope: container });

  return (
    <div ref={container} className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="header-element text-4xl font-extrabold tracking-tight text-white">Platform Overview</h1>
        <p className="header-element text-zinc-400 text-lg">
          Global analytics and metrics for your SaaS ecosystem.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <div 
            key={i} 
            className="kpi-card rounded-2xl border border-white/5 bg-zinc-950/50 backdrop-blur-sm p-6 flex flex-col gap-4 relative overflow-hidden transition-colors"
          >
            {/* Subtle glow effect behind card */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
            
            <div className="flex flex-row items-center justify-between">
              <h3 className="tracking-tight text-sm font-medium text-zinc-400">{kpi.title}</h3>
              <div className="p-2 rounded-xl bg-white/5">
                <kpi.icon className="kpi-icon h-4 w-4 text-zinc-500 transition-colors" />
              </div>
            </div>
            
            <div>
              <div className="text-3xl font-bold text-white tracking-tight">{kpi.value.toLocaleString()}</div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-zinc-500">
                  {kpi.description}
                </p>
                <span className="text-xs font-semibold text-emerald-400/90 bg-emerald-400/10 px-2 py-1 rounded-full">
                  {kpi.trend}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
