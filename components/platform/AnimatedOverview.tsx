import React from "react";
import { Building, AppWindow, ShieldAlert, TrendingUp } from "lucide-react";

interface AnimatedOverviewProps {
  data: {
    totalTenants: number;
    activeTenants: number;
    appInstalls: number;
    admins: number;
  };
}

export function AnimatedOverview({ data }: AnimatedOverviewProps) {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Platform Overview</h1>
        <p className="text-text-secondary">
          Global analytics and metrics for your SaaS ecosystem.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <div 
            key={i} 
            className="rounded-xl border border-border bg-bg-primary p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden"
          >
            <div className="flex flex-row items-center justify-between">
              <h3 className="tracking-tight text-sm font-medium text-text-secondary">{kpi.title}</h3>
              <div className="p-2 rounded-lg bg-bg-secondary text-text-secondary">
                <kpi.icon className="h-4 w-4" />
              </div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-text-primary tracking-tight">{kpi.value.toLocaleString()}</div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-text-secondary">
                  {kpi.description}
                </p>
                <span className="text-xs font-medium text-success">
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
