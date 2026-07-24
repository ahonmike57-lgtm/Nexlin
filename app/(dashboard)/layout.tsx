import { headers } from "next/headers"
import { db } from "@/lib/db"
import DashboardLayoutClient from "./DashboardLayoutClient"

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

  return (
    <div 
      className="w-full h-full bg-zinc-950 text-white selection:bg-primary/30"
      style={{
        ...(colors?.primary ? { '--color-primary': colors.primary } : {}),
        ...(colors?.bgPrimary ? { '--color-bg-primary': colors.bgPrimary } : {}),
        ...(colors?.textPrimary ? { '--color-text-primary': colors.textPrimary } : {})
      } as React.CSSProperties}
    >
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-zinc-950 to-zinc-950 opacity-60 pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-[url('/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
      <div className="relative z-10 h-full w-full">
        <DashboardLayoutClient agency={agency}>
          {children}
        </DashboardLayoutClient>
      </div>
    </div>
  )
}
