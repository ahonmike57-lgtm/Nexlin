export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getFunnels } from "@/app/actions/funnels"
import { UnifiedWebsiteBuilder, type BuilderSite } from "@/components/builder/UnifiedWebsiteBuilder"

export default async function ForgePage() {
  const session = await getSession()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const res = await getFunnels()
  const sites: BuilderSite[] =
    res.success && Array.isArray(res.data) ? (res.data as BuilderSite[]) : []

  return (
    <UnifiedWebsiteBuilder
      initialSite={sites[0] || null}
      allSites={sites}
      showSiteSwitcher
      backHref="/websites"
    />
  )
}
