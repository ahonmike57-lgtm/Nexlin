export const dynamic = 'force-dynamic';
import { getSession } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import FunnelBuilderClient from "./FunnelBuilderClient"
import { getFunnel } from "@/app/actions/funnels"
import { getAiSettings } from "@/app/actions/aiSettings"

export default async function FunnelBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const { id } = await params
  const funnelResponse = await getFunnel(id)
  
  if (!funnelResponse.success || !funnelResponse.data) {
    notFound()
  }

  const aiRes = await getAiSettings()
  const aiSettings = aiRes.success ? aiRes.settings : []

  return <FunnelBuilderClient funnel={funnelResponse.data} aiSettings={aiSettings} />
}
