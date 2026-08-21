import { getPlatformRevenueMetrics } from "@/app/actions/platform-admin"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, TrendingUp, Users, CreditCard, ShieldAlert } from "lucide-react"

export default async function PlatformRevenuePage() {
  const res = await getPlatformRevenueMetrics()

  if (!res.success || !res.data) {
    return (
      <div className="p-8 text-center">
        <ShieldAlert className="w-12 h-12 text-error mx-auto mb-3" />
        <h2 className="text-xl font-bold">Access Restricted</h2>
        <p className="text-sm text-text-secondary mt-1">
          Financial & Revenue metrics are strictly restricted to Platform Owners.
        </p>
      </div>
    )
  }

  const { mrr, arr, netVolume, activeCount, pastDueCount, trialingCount, tierCounts, recentSubscriptions } = res.data

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Global Revenue & SaaS Subscriptions</h1>
        <p className="text-sm text-text-secondary">Platform-wide MRR, recurring plan breakdowns, and payment gateway health.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-border bg-bg-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Monthly Recurring (MRR)</CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary">${mrr.toLocaleString()}</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">+{activeCount} active paid agency plans</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-bg-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Annual Run Rate (ARR)</CardTitle>
            <TrendingUp className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary">${arr.toLocaleString()}</div>
            <p className="text-xs text-text-secondary mt-1">Projected 12-month platform value</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-bg-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Gross Payment Volume</CardTitle>
            <CreditCard className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary">${Math.round(netVolume).toLocaleString()}</div>
            <p className="text-xs text-text-secondary mt-1">Includes AI & SMS rebilling markups</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-bg-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Subscription Health</CardTitle>
            <Users className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary">{activeCount} / {activeCount + pastDueCount + trialingCount}</div>
            <p className="text-xs text-text-secondary mt-1">{pastDueCount} past due · {trialingCount} trialing</p>
          </CardContent>
        </Card>
      </div>

      {/* Plan Distribution */}
      <Card className="border border-border bg-bg-primary shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Active SaaS Plan Tiers</CardTitle>
          <CardDescription className="text-xs">Distribution of subscribed agency workspace tiers.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-border bg-bg-secondary/40">
              <span className="text-xs font-semibold text-text-secondary">Starter Plan ($97/mo)</span>
              <p className="text-2xl font-bold text-text-primary mt-1">{tierCounts.starter}</p>
              <p className="text-[11px] text-text-secondary mt-0.5">${(tierCounts.starter * 97).toLocaleString()}/mo MRR</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-bg-secondary/40">
              <span className="text-xs font-semibold text-primary">Pro Unlimited ($297/mo)</span>
              <p className="text-2xl font-bold text-text-primary mt-1">{tierCounts.pro}</p>
              <p className="text-[11px] text-text-secondary mt-0.5">${(tierCounts.pro * 297).toLocaleString()}/mo MRR</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-bg-secondary/40">
              <span className="text-xs font-semibold text-indigo-500">Agency SaaS ($497/mo)</span>
              <p className="text-2xl font-bold text-text-primary mt-1">{tierCounts.unlimited}</p>
              <p className="text-[11px] text-text-secondary mt-0.5">${(tierCounts.unlimited * 497).toLocaleString()}/mo MRR</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-bg-secondary/40">
              <span className="text-xs font-semibold text-amber-500">Enterprise Custom ($997/mo)</span>
              <p className="text-2xl font-bold text-text-primary mt-1">{tierCounts.enterprise}</p>
              <p className="text-[11px] text-text-secondary mt-0.5">${(tierCounts.enterprise * 997).toLocaleString()}/mo MRR</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Subscriptions */}
      <Card className="border border-border bg-bg-primary shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Tenant Subscriptions Ledger</CardTitle>
          <CardDescription className="text-xs">Real-time status of tenant billing accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {recentSubscriptions.map((sub) => (
              <div key={sub.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{sub.agencyName}</p>
                  <p className="text-xs text-text-secondary capitalize">{sub.planTier} Tier</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold capitalize ${
                    sub.status === "active" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                    sub.status === "past_due" ? "bg-red-500/10 text-red-600 dark:text-red-400" :
                    "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  }`}>
                    {sub.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
