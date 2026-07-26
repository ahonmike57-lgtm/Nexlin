export const dynamic = 'force-dynamic';
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import TeamClient from "./TeamClient"
import { getTeamMembers } from "@/app/actions/settings"

export default async function TeamPage() {
  const session = await getSession()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const response = await getTeamMembers()
  const team = response.data || []

  return <TeamClient initialTeam={team} />
}
