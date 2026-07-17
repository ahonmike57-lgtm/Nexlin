import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { db as prisma } from "@/lib/db"
import SnapshotsClient from "./SnapshotsClient"

export default async function SnapshotsSettingsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user || !user.agencyId) {
    return <div>Agency access required.</div>
  }

  // Fetch all sub-agencies so we can deploy snapshots to them
  const subAgencies = await prisma.subAgency.findMany({
    where: { agencyId: user.agencyId }
  })

  return (
    <SnapshotsClient 
      agencyId={user.agencyId} 
      subAgencies={subAgencies.map(s => ({ id: s.id, name: s.name }))}
    />
  )
}
