import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import BrandingClient from "./BrandingClient"
import { getAgencyBranding } from "@/app/actions/settings"

export default async function BrandingPage() {
  const session = await getSession()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const agencyId = "agency-1"

  const response = await getAgencyBranding(agencyId)
  const branding = response.data || {}

  return <BrandingClient initialBranding={branding} agencyId={agencyId} />
}
