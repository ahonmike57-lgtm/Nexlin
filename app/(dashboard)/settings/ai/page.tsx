export const dynamic = 'force-dynamic';
import { getSession } from "@/lib/auth"
import { getOrCreateAgency } from "@/app/actions/agency"
import { getAiSettings } from "@/app/actions/aiSettings"
import AiSettingsClient from "./AiSettingsClient"
import { redirect } from "next/navigation"

export default async function AiSettingsPage() {
  const session = await getSession()
  if (!session?.user?.id) redirect("/login")

  const agencyId = await getOrCreateAgency()
  const res = await getAiSettings()
  const initialSettings = res.settings || []

  return <AiSettingsClient initialSettings={initialSettings} agencyId={agencyId} />
}
