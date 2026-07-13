import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import TeamClient from "./TeamClient"
import { getTeamMembers } from "@/app/actions/settings"

export default async function TeamPage() {
  const session = await getSession()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const agencyId = "agency-1"

  const response = await getTeamMembers(agencyId)
  const team = response.data || []

  return <TeamClient initialTeam={team} agencyId={agencyId} />
}
