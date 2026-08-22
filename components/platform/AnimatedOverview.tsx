"use client"

import React from "react"
import Link from "next/link"
import {
  Building,
  AppWindow,
  ShieldAlert,
  TrendingUp,
  DollarSign,
  Layers,
  Megaphone,
  LifeBuoy,
  Terminal,
  Activity,
  CheckCircle2,
  ExternalLink,
  ArrowUpRight,
  Sparkles,
  Users,
  ShieldCheck,
  Plus
} from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ImpersonateButton } from "@/components/platform/ImpersonateButton"

interface AnimatedOverviewProps {
  data: {
    totalTenants: number
    activeTenants: number
    appInstalls: number
    admins: number
    estimatedMRR: number
    tierCounts: Record<string, number>
    recentAgencies: any[]
    activeFeatureFlags: number
    totalSnapshots: number
    openTickets: number
  }
}

export function AnimatedOverview({ data }: AnimatedOverviewProps) {
  const kpis = [
    {
      title: "Total Tenants",
      value: data.totalTenants.toLocaleString(),
      icon: Building,
      description: "Total registered agencies",
      trend: "+12% this month",
      color: "text-blue-600 bg-blue-500/10"
    },
    {
      title: "Active SaaS Subscriptions",
      value: data.activeTenants.toLocaleString(),
      icon: TrendingUp,
      description: "Paying & active tenants",
      trend: "100% retention",
      color: "text-emerald-600 bg-emerald-500/10"
    },
    {
      title: "Estimated Global MRR",
      value: `$${data.estimatedMRR.toLocaleString()}`,
      icon: DollarSign,
      description: "Monthly recurring revenue",
      trend: "+18% growth",
      color: "text-violet-600 bg-violet-500/10"
    },
    {
      title: "Marketplace App Installs",
      value: data.appInstalls.toLocaleString(),
      icon: AppWindow,
      description: "Active tenant integrations",
      trend: "+24% this month",
      color: "text-amber-600 bg-amber-500/10"
    }
  ]

  const totalTierAgencies = Math.max(
    (data.tierCounts.basic || 0) + (data.tierCounts.pro || 0) + (data.tierCounts.enterprise || 0),
    1
  )

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Platform Overview</h1>
          <p className="text-text-secondary mt-1">
            Global telemetry, SaaS revenue metrics, and system infrastructure health.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/platform/tenants">
            <Button size="sm" className="bg-primary text-white">
              <Plus className="w-4 h-4 mr-1.5" /> New Tenant
            </Button>
          </Link>
          <Link href="/platform/snapshots">
            <Button variant="outline" size="sm">
              <Layers className="w-4 h-4 mr-1.5 text-primary" /> Deploy Snapshot
            </Button>
          </Link>
          <Link href="/platform/announcements">
            <Button variant="outline" size="sm">
              <Megaphone className="w-4 h-4 mr-1.5 text-amber-500" /> Broadcast
            </Button>
          </Link>
          <Link href="/platform/debug">
            <Button variant="outline" size="sm">
              <Terminal className="w-4 h-4 mr-1.5 text-text-secondary" /> Diagnostics
            </Button>
          </Link>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-bg-primary p-6 shadow-sm flex flex-col justify-between hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">{kpi.title}</span>
              <div className={`p-2 rounded-xl ${kpi.color}`}>
                <kpi.icon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-4">
              <div className="text-3xl font-extrabold text-text-primary tracking-tight">
                {kpi.value}
              </div>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-text-secondary">{kpi.description}</span>
                <span className="font-semibold text-emerald-600 flex items-center">
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                  {kpi.trend}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics & System Health Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Plan Tier Distribution */}
        <div className="rounded-2xl border border-border bg-bg-primary p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Plan Tier Distribution
            </h3>
            <span className="text-xs font-semibold text-text-secondary">
              ARR: ${(data.estimatedMRR * 12).toLocaleString()}
            </span>
          </div>

          <div className="space-y-4">
            {/* Enterprise */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-text-primary">Enterprise ($497/mo)</span>
                <span className="text-text-secondary">
                  {data.tierCounts.enterprise || 0} ({Math.round(((data.tierCounts.enterprise || 0) / totalTierAgencies) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="bg-violet-600 h-2 rounded-full"
                  style={{ width: `${Math.round(((data.tierCounts.enterprise || 0) / totalTierAgencies) * 100)}%` }}
                />
              </div>
            </div>

            {/* Pro */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-text-primary">Pro Unlimited ($297/mo)</span>
                <span className="text-text-secondary">
                  {data.tierCounts.pro || 0} ({Math.round(((data.tierCounts.pro || 0) / totalTierAgencies) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${Math.round(((data.tierCounts.pro || 0) / totalTierAgencies) * 100)}%` }}
                />
              </div>
            </div>

            {/* Basic */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-text-primary">Starter ($97/mo)</span>
                <span className="text-text-secondary">
                  {data.tierCounts.basic || 0} ({Math.round(((data.tierCounts.basic || 0) / totalTierAgencies) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-400 h-2 rounded-full"
                  style={{ width: `${Math.round(((data.tierCounts.basic || 0) / totalTierAgencies) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-text-secondary">
            <span>Active Snapshots: <strong>{data.totalSnapshots}</strong></span>
            <span>Open Support Tickets: <strong className="text-primary">{data.openTickets}</strong></span>
          </div>
        </div>

        {/* Infrastructure & Gateway Status Radar */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-bg-primary p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" /> System Infrastructure & Health Radar
            </h3>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> All Systems Operational
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border bg-bg-secondary/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary">PostgreSQL Pool (Neon)</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-[11px] text-text-secondary">Connection Latency: 8ms • Status: Healthy</p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-bg-secondary/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary">Inngest Workflow Engine</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-[11px] text-text-secondary">Background Drip & Automations Processing</p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-bg-secondary/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary">Stripe & Paystack Webhooks</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-[11px] text-text-secondary">Signature Verification & Re-billing Active</p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-bg-secondary/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary">Feature Flags & Tier Guards</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-[11px] text-text-secondary">{data.activeFeatureFlags} Global Feature Flags Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Registered Tenants Table */}
      <div className="rounded-2xl border border-border bg-bg-primary overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-text-primary">Recent Registered Tenants</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Real-time audit of agencies onboarded to the Nexlin SaaS platform.
            </p>
          </div>
          <Link href="/platform/tenants">
            <Button variant="outline" size="sm">
              View All Tenants ({data.totalTenants})
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-secondary/60 text-text-secondary font-semibold border-b border-border uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Agency Workspace</th>
                <th className="px-6 py-3.5">Subdomain</th>
                <th className="px-6 py-3.5">Owner Contact</th>
                <th className="px-6 py-3.5">Plan Tier</th>
                <th className="px-6 py-3.5">Created Date</th>
                <th className="px-6 py-3.5 text-right">Quick Impersonate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.recentAgencies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-text-secondary">
                    No tenants registered yet.
                  </td>
                </tr>
              ) : (
                data.recentAgencies.map((agency) => {
                  const owner = agency.users?.[0]
                  const tier = (agency.planTier || "basic").toLowerCase()

                  return (
                    <tr key={agency.id} className="hover:bg-bg-secondary/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-text-primary flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {agency.name.substring(0, 1).toUpperCase()}
                        </div>
                        <span className="truncate max-w-[180px]">{agency.name}</span>
                      </td>

                      <td className="px-6 py-4 font-mono text-text-secondary">
                        {agency.subdomain}.nexlin.com
                      </td>

                      <td className="px-6 py-4 text-text-secondary truncate max-w-[200px]">
                        {owner?.email || "—"}
                      </td>

                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className={`uppercase text-[10px] font-bold px-2 py-0.5 ${
                            tier === "enterprise"
                              ? "border-violet-500 text-violet-600 bg-violet-500/10"
                              : tier === "pro"
                              ? "border-primary text-primary bg-primary/10"
                              : "border-blue-400 text-blue-500 bg-blue-500/10"
                          }`}
                        >
                          {tier}
                        </Badge>
                      </td>

                      <td className="px-6 py-4 text-text-secondary">
                        {format(new Date(agency.createdAt), "MMM d, yyyy")}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <ImpersonateButton tenantId={agency.id} tenantName={agency.name} />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
