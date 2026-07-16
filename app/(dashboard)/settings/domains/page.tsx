export const dynamic = 'force-dynamic';
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import DomainClient from "./DomainClient"

export default async function DomainsPage() {
  const session = await getSession()
  if (!session?.user?.id) redirect("/login")

  const user = await db.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user?.agencyId) return <div>No agency found</div>

  const funnels = await db.funnel.findMany({
    where: { agencyId: user.agencyId },
    select: { id: true, name: true, customDomain: true }
  })

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Custom Domains</h1>
        <p className="text-text-secondary mt-1">Manage custom domains for your funnels and websites.</p>
      </div>
      
      <DomainClient initialFunnels={funnels} agencyId={user.agencyId} />
    </div>
  )
}

