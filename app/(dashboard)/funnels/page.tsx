import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import FunnelsClient from "./FunnelsClient"
import { getFunnels } from "@/app/actions/funnels"

export default async function FunnelsPage() {
  const session = await getSession()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const agencyId = "agency-1" // Mock agency ID

  const funnelsResponse = await getFunnels(agencyId)
  const funnels = funnelsResponse.data || []

  return <FunnelsClient initialFunnels={funnels} agencyId={agencyId} />
}
