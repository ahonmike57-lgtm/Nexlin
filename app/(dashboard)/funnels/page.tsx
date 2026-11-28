export const dynamic = "force-dynamic"

import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import FunnelsClient from "./FunnelsClient"
import { getFunnels } from "@/app/actions/funnels"
import { getOrCreateAgency } from "@/app/actions/agency"

export default async function FunnelsPage() {
  const session = await getSession()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const agencyId = (session.user as any).agencyId || (await getOrCreateAgency())
  const [funnelsResponse, capturedLeads] = await Promise.all([
    getFunnels(),
    db.contact.count({
      where: {
        agencyId,
        deletedAt: null,
        tags: { contains: "funnel_submission" },
      },
    }),
  ])

  const funnels = funnelsResponse.success && funnelsResponse.data ? funnelsResponse.data : []

  return (
    <FunnelsClient
      initialFunnels={funnels}
      agencyId={agencyId}
      stats={{ capturedLeads }}
    />
  )
}
