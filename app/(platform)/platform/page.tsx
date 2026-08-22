export const dynamic = "force-dynamic"

import { db } from "@/lib/db"
import { AnimatedOverview } from "@/components/platform/AnimatedOverview"

export default async function PlatformOverviewPage() {
  try {
    const [
      totalTenants,
      activeTenants,
      appInstalls,
      admins,
      recentAgencies,
      planTiersGroup,
      activeFeatureFlags,
      totalSnapshots,
      openTickets
    ] = await Promise.all([
      db.agency.count(),
      db.agency.count({ where: { status: "active" } }),
      db.tenantApp.count(),
      db.platformAdmin.count(),
      db.agency.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          subdomain: true,
          planTier: true,
          status: true,
          createdAt: true,
          users: {
            take: 1,
            select: { email: true, name: true }
          }
        }
      }),
      db.agency.groupBy({
        by: ['planTier'],
        _count: { id: true }
      }),
      db.featureFlag.count({ where: { isEnabledGlobal: true } }),
      db.snapshot.count(),
      db.ticket.count({ where: { status: "open" } })
    ])

    // Calculate Estimated MRR based on tier pricing
    // Basic: $97/mo, Pro: $297/mo, Enterprise: $497/mo
    const tierPricing: Record<string, number> = {
      basic: 97,
      pro: 297,
      enterprise: 497
    }

    let estimatedMRR = 0
    const tierCounts: Record<string, number> = { basic: 0, pro: 0, enterprise: 0 }

    planTiersGroup.forEach((item: any) => {
      const tier = (item.planTier || "basic").toLowerCase()
      tierCounts[tier] = (tierCounts[tier] || 0) + item._count.id
      estimatedMRR += (tierPricing[tier] || 97) * item._count.id
    })

    return (
      <AnimatedOverview
        data={{
          totalTenants,
          activeTenants,
          appInstalls,
          admins,
          estimatedMRR,
          tierCounts,
          recentAgencies,
          activeFeatureFlags,
          totalSnapshots,
          openTickets
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
