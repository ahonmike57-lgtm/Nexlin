import { getPlatformAnnouncements } from "@/app/actions/platform-admin"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Megaphone, Plus, Bell, ShieldAlert, CheckCircle2, AlertTriangle, Info } from "lucide-react"

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

  const announcements = res.data

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Global In-App Announcements</h1>
          <p className="text-sm text-text-secondary">Broadcast maintenance alerts, new features, and notices to all agency owners.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> New System Broadcast
        </Button>
      </div>

      {/* Announcements List */}
      <Card className="border border-border bg-bg-primary shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Active & Past Broadcasts</CardTitle>
          <CardDescription className="text-xs">Live banners displayed on tenant dashboard headers.</CardDescription>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <div className="p-8 text-center text-text-secondary text-sm">
              <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
              No active announcements. Create one to notify all connected agencies.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {announcements.map((a) => (
                <div key={a.id} className="py-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary mt-0.5">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-text-primary">{a.title}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-bg-secondary text-text-secondary">
                          {a.type}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-1">{a.message}</p>
                      <p className="text-[10px] text-text-secondary mt-2">
                        Posted by {a.author} · {new Date(a.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    a.isActive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-bg-secondary text-text-secondary"
                  }`}>
                    {a.isActive ? "Live" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
