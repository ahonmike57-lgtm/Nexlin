import { getPlatformAnnouncements } from "@/app/actions/platform-admin"
import { AnnouncementsClient } from "./AnnouncementsClient"
import { ShieldAlert } from "lucide-react"

export default async function PlatformAnnouncementsPage() {
  const res = await getPlatformAnnouncements()

  if (!res.success || !res.data) {
    return (
      <div className="p-8 text-center">
        <ShieldAlert className="w-12 h-12 text-error mx-auto mb-3" />
        <h2 className="text-xl font-bold">Access Restricted</h2>
        <p className="text-sm text-text-secondary mt-1">
          System Broadcasts are restricted to Platform Owners & Support Admins.
        </p>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-300">
      <AnnouncementsClient initialAnnouncements={res.data as any} />
    </div>
  )
}
