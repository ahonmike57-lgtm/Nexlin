export const dynamic = 'force-dynamic';
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getOrCreateAgency } from "@/app/actions/agency"
import VoiceClient from "./VoiceClient"
import { getVoiceAgents } from "@/app/actions/voice"

export default async function VoicePage() {
  const session = await getSession()
  if (!session?.user?.id) redirect("/login")

  const agencyId = await getOrCreateAgency()
  const res = await getVoiceAgents(agencyId)
  const initialAgents = res.success && res.agents ? res.agents : []

  return <VoiceClient initialAgents={initialAgents} agencyId={agencyId} />
}
