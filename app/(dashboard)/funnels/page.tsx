export const dynamic = 'force-dynamic';
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import FunnelsClient from "./FunnelsClient"
import { getFunnels } from "@/app/actions/funnels"
import { cookies } from "next/headers"

export default async function FunnelsPage() {
  const session = await getSession()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const cookieStore = await cookies()
  const agencyId = cookieStore.get("agencyId")?.value
  if (!agencyId) redirect("/onboarding")

  const funnelsResponse = await getFunnels(agencyId)
  const funnels = funnelsResponse.data || []

  return <FunnelsClient initialFunnels={funnels} agencyId={agencyId} />
}

