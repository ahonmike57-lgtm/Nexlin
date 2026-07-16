export const dynamic = 'force-dynamic';
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import PipelinesClient from "./PipelinesClient"

export default async function PipelinesSettingsPage() {
  const cookieStore = await cookies()
  const agencyId = cookieStore.get("agencyId")?.value
  if (!agencyId) return redirect("/onboarding")

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

