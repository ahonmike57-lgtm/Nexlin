export const dynamic = 'force-dynamic';
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getVoiceAgents } from "@/app/actions/voice"
import VoiceClient from "./VoiceClient"

export default async function VoicePage() {
  const session = await getSession()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const agencyId = "agency-1" // Mock agency ID

  const res = await getVoiceAgents(agencyId)
  const initialAgents = (res.success && res.agents) ? res.agents : []

  return <VoiceClient initialAgents={initialAgents} agencyId={agencyId} />
}

