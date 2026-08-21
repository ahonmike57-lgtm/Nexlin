import { getPlatformBlueprintSnapshots, getPlatformAgenciesList } from "@/app/actions/platform-admin"
import { SnapshotsClient } from "./SnapshotsClient"
import { ShieldAlert } from "lucide-react"

export default async function PlatformSnapshotsPage() {
  const [res, agencies] = await Promise.all([
    getPlatformBlueprintSnapshots(),
    getPlatformAgenciesList()
  ])

  if (!res.success || !res.data) {
    return (
      <div className="p-8 text-center">
        <ShieldAlert className="w-12 h-12 text-error mx-auto mb-3" />
        <h2 className="text-xl font-bold">Access Restricted</h2>
        <p className="text-sm text-text-secondary mt-1">
          Blueprint Snapshots are restricted to Platform Owners & Developers.
        </p>
      </div>
    )
  }

  const { blueprintTemplates } = res.data

  return (
    <div className="animate-in fade-in duration-300">
      <SnapshotsClient 
        blueprints={blueprintTemplates} 
        agencies={agencies}
      />
    </div>
  )
}
