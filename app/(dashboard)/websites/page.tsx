export const dynamic = 'force-dynamic';
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getOrCreateAgency } from "@/app/actions/agency"
import { getFunnels } from "@/app/actions/funnels"
import WebsitesClient from "./WebsitesClient"

export default async function WebsitesPage() {
  const session = await getSession()
  if (!session?.user?.id) redirect("/login")

  const agencyId = await getOrCreateAgency()
  const funnelsResponse = await getFunnels(agencyId)

  return <WebsitesClient initialWebsites={funnelsResponse.data || []} agencyId={agencyId} />
}
