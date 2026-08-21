import { getPlatformSupportTickets } from "@/app/actions/platform-admin"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LifeBuoy, ShieldAlert, Clock, CheckCircle2, AlertCircle } from "lucide-react"

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

  const tickets = res.data

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Cross-Tenant Support Queue</h1>
        <p className="text-sm text-text-secondary">Triage, manage, and resolve tickets submitted by agency owners.</p>
      </div>

      {/* Ticket List */}
      <Card className="border border-border bg-bg-primary shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Incoming Agency Tickets ({tickets.length})</CardTitle>
          <CardDescription className="text-xs">Prioritized by SLA response time and plan tier.</CardDescription>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="p-8 text-center text-text-secondary text-sm">
              <LifeBuoy className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
              All caught up! No unresolved support tickets.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {tickets.map((t) => (
                <div key={t.id} className="py-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-text-primary">{t.title}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        t.priority === "urgent" ? "bg-red-500/10 text-red-600 dark:text-red-400" :
                        t.priority === "high" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                        "bg-bg-secondary text-text-secondary"
                      }`}>
                        {t.priority}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">{t.description || "No details provided."}</p>
                    <p className="text-[11px] text-text-secondary mt-2 flex items-center gap-2">
                      <span className="font-semibold text-primary">{t.agency.name}</span>
                      <span>·</span>
                      <span>Submitted by {t.contact?.firstName || "Agency Owner"}</span>
                      <span>·</span>
                      <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm">
                      Reply & Resolve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
