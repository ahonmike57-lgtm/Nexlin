import { getApiKeys } from "@/app/actions/api-keys"
import { ApiKeyManagement } from "@/components/settings/ApiKeyManagement"

export const dynamic = "force-dynamic"

export default async function ApiKeysPage() {
  const res = await getApiKeys()
  const initialKeys = res.success && res.apiKeys ? res.apiKeys : []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Developer API Keys</h1>
        <p className="text-text-secondary text-sm">Manage API tokens for programmatic access to your tenant data.</p>
      </div>

      <ApiKeyManagement initialKeys={initialKeys} />
    </div>
  )
}
