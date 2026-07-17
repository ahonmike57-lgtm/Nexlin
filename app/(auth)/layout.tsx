import { ReactNode } from "react"
import { headers } from "next/headers"
import { db } from "@/lib/db"

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const requestHeaders = await headers()
  const customDomain = requestHeaders.get("x-custom-domain")
  
  let agency = null
  let colors: any = null

  if (customDomain) {
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000"
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
        try { colors = JSON.parse(agency.brandColors) } catch(e) {}
      }
    }
  }

  const platformName = agency?.whiteLabelName || agency?.name || "NEXLIN GHL"
  const platformLogo = agency?.logoUrl
  const brandInitial = platformName.substring(0, 1).toUpperCase()
  const loginBg = agency?.loginBackgroundImage

  return (
    <div 
      className="min-h-screen grid grid-cols-1 md:grid-cols-2"
      style={{
        ...(colors?.primary ? { '--color-primary': colors.primary } : {}),
        ...(colors?.bgPrimary ? { '--color-bg-primary': colors.bgPrimary } : {}),
        ...(colors?.textPrimary ? { '--color-text-primary': colors.textPrimary } : {})
      } as React.CSSProperties}
    >
      <div className="flex flex-col justify-center items-center p-8 bg-bg-primary">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2">
            {platformLogo ? (
              <img src={platformLogo} alt="Logo" className="max-h-8 object-contain" />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-xl">{brandInitial}</span>
              </div>
            )}
            {!platformLogo && <span className="text-xl font-bold tracking-tight text-primary">{platformName}</span>}
          </div>
          {children}
        </div>
      </div>
      <div className="hidden md:flex bg-primary p-12 flex-col justify-between text-white relative overflow-hidden">
        {loginBg && (
          <img src={loginBg} alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay" />
        )}
        <div className="relative z-10"></div>
        <div className="relative z-10">
          <h2 className="text-4xl font-bold mb-4">Every part of your business. One intelligent platform.</h2>
          <p className="text-primary-100 text-lg opacity-90">
            Join thousands of modern enterprises using {platformName} to scale their operations globally.
          </p>
        </div>
        <div className="flex gap-2 relative z-10">
          <div className="h-2 w-16 bg-white rounded-full"></div>
          <div className="h-2 w-2 bg-white/30 rounded-full"></div>
          <div className="h-2 w-2 bg-white/30 rounded-full"></div>
        </div>
      </div>
    </div>
  )
}
