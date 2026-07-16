export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db as prisma } from "@/lib/db"
import { getReputationData } from "@/app/actions/reputation"
import ReputationClient from "./ReputationClient"
import { redirect } from "next/navigation"

export default async function ReputationPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { agencyId: true }
  })

  if (!user?.agencyId) redirect("/onboarding")

  const res = await getReputationData(user.agencyId)
  
  // Contacts for the "Send Review Request" modal
  const contacts = await prisma.contact.findMany({
    where: { agencyId: user.agencyId },
    select: { id: true, firstName: true, lastName: true, email: true, phone: true }
  })

  return <ReputationClient 
    initialData={res.success ? res : { reviews: [], requests: [], stats: { totalReviews: 0, averageRating: "0", requestsSent: 0 } }} 
    contacts={contacts}
    agencyId={user.agencyId}
  />
}

