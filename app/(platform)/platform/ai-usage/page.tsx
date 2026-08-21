import { getPlatformAiUsageMetrics } from "@/app/actions/platform-admin"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Cpu, Zap, Activity, DollarSign, ShieldAlert } from "lucide-react"

export default async function PlatformAiUsagePage() {
  const res = await getPlatformAiUsageMetrics()

  if (!res.success || !res.data) {
    return (
      <div className="p-8 text-center">
        <ShieldAlert className="w-12 h-12 text-error mx-auto mb-3" />
        <h2 className="text-xl font-bold">Access Restricted</h2>
        <p className="text-sm text-text-secondary mt-1">
          AI Spend & Model Metrics are restricted to Platform Owners & Developers.
        </p>
      </div>
    )
  }

  const { totalGenerations, estimatedTokens, totalApiCost, rebilledRevenue, grossMargin, providers } = res.data

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Global AI Usage & Upstream Spend</h1>
        <p className="text-sm text-text-secondary">Track multi-model AI token consumption, upstream provider costs, and rebilling margins.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-border bg-bg-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Total Generations</CardTitle>
            <Zap className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary">{totalGenerations.toLocaleString()}</div>
            <p className="text-xs text-text-secondary mt-1">Across all agency funnels & copilot</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-bg-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Est. Tokens Consumed</CardTitle>
            <Cpu className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary">{(estimatedTokens / 1000000).toFixed(2)}M</div>
            <p className="text-xs text-text-secondary mt-1">Input + Output token volume</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-bg-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Upstream API Cost</CardTitle>
            <DollarSign className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary">${totalApiCost.toFixed(2)}</div>
            <p className="text-xs text-text-secondary mt-1">Direct Google/OpenAI wholesale cost</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-bg-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Rebilled Margin</CardTitle>
            <Activity className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{grossMargin}%</div>
            <p className="text-xs text-text-secondary mt-1">${rebilledRevenue.toFixed(2)} charged to agencies</p>
          </CardContent>
        </Card>
      </div>

      {/* Provider Health & Latency */}
      <Card className="border border-border bg-bg-primary shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Active AI Provider Router</CardTitle>
          <CardDescription className="text-xs">Dynamic routing load distribution across multi-modal models.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {providers.map((p) => (
              <div key={p.name} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{p.name}</p>
                  <p className="text-xs text-text-secondary">Avg. Response Latency: {p.latency}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono font-bold text-text-primary">{p.share} Traffic</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                    {p.status}
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
