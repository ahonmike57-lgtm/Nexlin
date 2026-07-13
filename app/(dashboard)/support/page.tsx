import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getTickets } from "@/app/actions/support"
import SupportClient from "./SupportClient"

export default async function SupportPage() {
  const session = await getSession()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const agencyId = "agency-1" // Mock agency ID

  const res = await getTickets(agencyId)
  const initialTickets = (res.success && res.tickets) ? res.tickets : []

  return <SupportClient initialTickets={initialTickets} agencyId={agencyId} />
}
