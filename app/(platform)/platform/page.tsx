import { db } from "@/lib/db"
import { Building, AppWindow, ShieldAlert, TrendingUp } from "lucide-react"

export default async function PlatformOverviewPage() {
  try {
    const [totalTenants, activeTenants, appInstalls, admins] = await Promise.all([
      db.agency.count(),
      db.agency.count({ where: { status: "active" } }),
      db.tenantApp.count(),
      db.platformAdmin.count(),
    ])

    const kpis = [
      {
        title: "Total Tenants",
        value: totalTenants,
        icon: Building,
        description: "Total agencies registered",
        trend: "+12% this month"
      },
      {
        title: "Active Tenants",
        value: activeTenants,
        icon: TrendingUp,
        description: "Agencies actively using the platform",
        trend: "+8% this month"
      },
      {
        title: "App Installs",
        value: appInstalls,
        icon: AppWindow,
        description: "Total marketplace apps installed",
        trend: "+24% this month"
      },
      {
        title: "Platform Admins",
        value: admins,
        icon: ShieldAlert,
        description: "Users with platform access",
        trend: "Stable"
      }
    ]

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
          <p className="text-muted-foreground">
            Global analytics and metrics for your SaaS ecosystem.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi, i) => (
            <div key={i} className="rounded-xl border bg-card text-card-foreground shadow">
              <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">{kpi.title}</h3>
                <kpi.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="p-6 pt-0">
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {kpi.description}
                </p>
                <div className="text-xs text-emerald-500 font-medium mt-2">
                  {kpi.trend}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  } catch (e: any) {
    return (
      <div className="p-8 bg-red-50 text-red-500 border border-red-200 rounded-xl">
        <h2 className="font-bold text-lg mb-2">Error loading platform data</h2>
        <pre className="whitespace-pre-wrap">{e.message}</pre>
        <pre className="whitespace-pre-wrap text-sm mt-4">{e.stack}</pre>
      </div>
    )
  }
}
