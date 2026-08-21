export const dynamic = 'force-dynamic';
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import MarketplaceClient from "./MarketplaceClient"
import { TOP_30_MARKETPLACE_APPS } from "@/lib/marketplace-apps-seed"

export default async function MarketplacePage() {
  const session = await getSession()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  // Ensure all 30 top necessary apps exist in the database
  let apps = await db.app.findMany({ orderBy: { sortOrder: "asc" } })
  
  if (apps.length < 30) {
    for (const appData of TOP_30_MARKETPLACE_APPS) {
      try {
        await db.app.upsert({
          where: { id: appData.id },
          update: {
            name: appData.name,
            category: appData.category,
            tagline: appData.tagline,
            description: appData.description,
            installType: appData.installType,
            badge: appData.badge,
            sortOrder: appData.sortOrder
          },
          create: {
            id: appData.id,
            name: appData.name,
            category: appData.category,
            tagline: appData.tagline,
            description: appData.description,
            installType: appData.installType,
            badge: appData.badge,
            sortOrder: appData.sortOrder
          }
        })
      } catch (e) {
        console.warn(`Marketplace seed: skipped app ${appData.id}:`, e)
      }
    }
    apps = await db.app.findMany({ orderBy: { sortOrder: "asc" } })
  }
  
  const { getOrCreateAgency } = await import("@/app/actions/agency")
  const agencyId = await getOrCreateAgency()
  
  const installs = await db.tenantApp.findMany({
    where: { agencyId: agencyId }
  })

  return <MarketplaceClient 
    initialApps={apps} 
    initialInstalls={installs} 
    agencyId={agencyId} 
  />
}
