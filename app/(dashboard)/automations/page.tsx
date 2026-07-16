export const dynamic = 'force-dynamic';
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import AutomationsClient from "./AutomationsClient"
import { getWorkflows } from "@/app/actions/automations"
import { getOrCreateAgency } from "@/app/actions/agency"

export default async function AutomationsPage() {
  const session = await getSession()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const agencyId = await getOrCreateAgency()

  const response = await getWorkflows(agencyId)
  const workflows = response.data || []

  return <AutomationsClient initialWorkflows={workflows} agencyId={agencyId} />
}

