export const dynamic = 'force-dynamic';
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getOrCreateAgency } from "@/app/actions/agency"
import SupportClient from "./SupportClient"
import { getTickets } from "@/app/actions/support"

export default async function SupportPage() {
  const session = await getSession()
  if (!session?.user?.id) redirect("/login")

  const agencyId = await getOrCreateAgency()
  const res = await getTickets(agencyId)
  const initialTickets = res.success && res.tickets ? res.tickets : []

  return <SupportClient initialTickets={initialTickets} agencyId={agencyId} />
}
