export const dynamic = 'force-dynamic'

import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getOrCreateAgency } from "@/app/actions/agency"
import { db } from "@/lib/db"
import { getTickets } from "@/app/actions/support"
import SupportClient from "./SupportClient"

export default async function SupportPage() {
  const session = await getSession()
  if (!session?.user?.id) redirect("/login")

  const agencyId = await getOrCreateAgency()

  const [ticketsRes, contacts, staffMembers] = await Promise.all([
    getTickets(agencyId),
    db.contact.findMany({
      where: { agencyId },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      take: 50,
      orderBy: { createdAt: "desc" }
    }),
    db.user.findMany({
      where: { agencyId },
      select: { id: true, name: true, email: true, role: true },
      take: 20
    })
  ])

  const initialTickets = ticketsRes.success && ticketsRes.tickets ? ticketsRes.tickets : []

  return (
    <SupportClient
      initialTickets={initialTickets}
      agencyId={agencyId}
      contacts={contacts}
      staffMembers={staffMembers}
    />
  )
}
