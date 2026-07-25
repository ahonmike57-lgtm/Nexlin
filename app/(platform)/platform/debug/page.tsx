export const dynamic = "force-dynamic"

import { getSystemDebugLogs } from "@/app/actions/debug"
import { getTenants } from "@/app/actions/tenants"
import { DebugHubClient } from "./DebugHubClient"

export default async function DebugLogsPage() {
  const logsRes = await getSystemDebugLogs()
  const tenantsRes = await getTenants()

  const logsData = logsRes.success && logsRes.logs ? logsRes.logs : {
    impersonationLogs: [],
    usageLogs: [],
    webhooks: [],
    tenantApps: []
  }

  const tenantsList = tenantsRes.success && tenantsRes.tenants ? tenantsRes.tenants : []

  return <DebugHubClient logsData={logsData} tenantsList={tenantsList} />
}
