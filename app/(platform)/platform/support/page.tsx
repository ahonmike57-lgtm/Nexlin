import { getPlatformSupportTickets } from "@/app/actions/platform-admin"
import { SupportQueueClient } from "./SupportQueueClient"
import { ShieldAlert } from "lucide-react"

export default async function PlatformSupportQueuePage() {
  const res = await getPlatformSupportTickets()

  if (!res.success || !res.data) {
    return (
      <div className="p-8 text-center">
        <ShieldAlert className="w-12 h-12 text-error mx-auto mb-3" />
        <h2 className="text-xl font-bold">Access Restricted</h2>
        <p className="text-sm text-text-secondary mt-1">
          The Support Queue is restricted to Platform Owners & Support Staff.
        </p>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-300">
      <SupportQueueClient initialTickets={res.data as any} />
    </div>
  )
}
