import { db } from "@/lib/db"
import { AnimatedOverview } from "@/components/platform/AnimatedOverview"

export default async function PlatformOverviewPage() {
  try {
    const [totalTenants, activeTenants, appInstalls, admins] = await Promise.all([
      db.agency.count(),
      db.agency.count({ where: { status: "active" } }),
      db.tenantApp.count(),
      db.platformAdmin.count(),
    ])

    return (
      <AnimatedOverview 
        data={{
          totalTenants,
          activeTenants,
          appInstalls,
          admins
        }} 
      />
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
