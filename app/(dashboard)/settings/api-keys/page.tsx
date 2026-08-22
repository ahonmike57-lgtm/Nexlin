export const dynamic = "force-dynamic"

import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getApiKeys } from "@/app/actions/api-keys"
import { getAiSettings } from "@/app/actions/aiSettings"
import { getMcpConnections } from "@/app/actions/mcp"
import { getOrCreateAgency } from "@/app/actions/agency"
import DeveloperHubClient from "./DeveloperHubClient"

export default async function ApiKeysPage() {
  const session = await getSession()
  if (!session?.user?.id) redirect("/login")

  const [keysRes, aiRes, mcpRes, agencyId] = await Promise.all([
    getApiKeys(),
    getAiSettings(),
    getMcpConnections(),
    getOrCreateAgency()
  ])

  const initialKeys = keysRes.success && keysRes.apiKeys ? keysRes.apiKeys : []
  const initialAiSettings = aiRes.settings || []
  const initialMcpConnections = mcpRes.success && mcpRes.connections ? mcpRes.connections : []

  return (
    <DeveloperHubClient
      initialKeys={initialKeys}
      initialAiSettings={initialAiSettings}
      initialMcpConnections={initialMcpConnections}
      agencyId={agencyId}
    />
  )
}
