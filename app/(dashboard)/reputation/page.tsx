export const dynamic = 'force-dynamic';
import { getSession } from "@/lib/auth"
import { db as prisma } from "@/lib/db"
import { getReputationData } from "@/app/actions/reputation"
import { getOrCreateAgency } from "@/app/actions/agency"
import ReputationClient from "./ReputationClient"
import { redirect } from "next/navigation"

export default async function ReputationPage() {
  const session = await getSession()
  if (!session?.user?.id) redirect("/login")

  const agencyId = await getOrCreateAgency()

  const res = await getReputationData(agencyId)
  
  // Contacts for the "Send Review Request" modal
  const contacts = await prisma.contact.findMany({
    where: { agencyId: agencyId },
    select: { id: true, firstName: true, lastName: true, email: true, phone: true }
  })

  return <ReputationClient 
    initialData={res.success ? res : { reviews: [], requests: [], stats: { totalReviews: 0, averageRating: "0", requestsSent: 0 } }} 
    contacts={contacts}
    agencyId={agencyId}
  />
}
