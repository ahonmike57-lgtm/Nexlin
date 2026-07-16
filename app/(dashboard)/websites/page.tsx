export const dynamic = 'force-dynamic';
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import WebsitesClient from "./WebsitesClient"
import { getFunnels } from "@/app/actions/funnels" // Re-using funnels actions for websites for now

export default async function WebsitesPage() {
  const session = await getSession()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  // Use getFunnels as a placeholder; in a real schema we'd have a Website model or a type field on Funnel
  const funnelsResponse = await getFunnels(session.user.id)
  
  return <WebsitesClient initialWebsites={funnelsResponse.data || []} agencyId={session.user.id} />
}

