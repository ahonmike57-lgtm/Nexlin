export const dynamic = 'force-dynamic';
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { getOrCreateAgency } from "@/app/actions/agency"
import { redirect } from "next/navigation"
import PipelinesClient from "./PipelinesClient"
import { getActiveSubAccountId } from "@/app/actions/subaccounts"

export default async function PipelinesSettingsPage() {
  const session = await getSession()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const agencyId = await getOrCreateAgency()

  const pipelines = await db.pipeline.findMany({
    where: { agencyId },
    include: {
      stages: {
        orderBy: { order: "asc" }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pipeline Settings</h1>
        <p className="text-text-secondary">Manage your sales pipelines and stages.</p>
      </div>
      
      <PipelinesClient initialPipelines={pipelines} />
    </div>
  )
}

