import { headers } from "next/headers"
import { db } from "@/lib/db"
import DashboardLayoutClient from "./DashboardLayoutClient"
import { getFeatureFlags } from "@/app/actions/feature-flags"
import { getOrCreateAgency } from "@/app/actions/agency"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers()
  const customDomain = requestHeaders.get("x-custom-domain")
  
  let agency = null
  let colors = null

  if (customDomain) {
    // Determine root domain
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000"
    
    // Only search if it's not the root domain
    if (customDomain !== rootDomain) {
      agency = await db.agency.findFirst({
        where: {
          OR: [
            { customDomain: customDomain },
            { subdomain: customDomain }
          ]
        }
      })
      
      if (agency?.brandColors) {
        try {
          colors = JSON.parse(agency.brandColors)
        } catch(e) {}
      }
    }
  }

  // Fallback to active agency if not resolved by domain
  if (!agency) {
    const agencyId = await getOrCreateAgency()
    agency = await db.agency.findUnique({ where: { id: agencyId } })
  }

  const { flags } = await getFeatureFlags()

  return (
    <div 
      className="w-full h-full"
      style={{
        ...(colors?.primary ? { '--color-primary': colors.primary } : {}),
        ...(colors?.bgPrimary ? { '--color-bg-primary': colors.bgPrimary } : {}),
        ...(colors?.textPrimary ? { '--color-text-primary': colors.textPrimary } : {})
      } as React.CSSProperties}
    >
      <DashboardLayoutClient agency={agency} featureFlags={flags || []}>
        {children}
      </DashboardLayoutClient>
    </div>
  )
}
