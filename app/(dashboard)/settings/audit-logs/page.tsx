import { getTenantAuditLogs } from "@/app/actions/tenant-audit"
import { Shield, Clock, User } from "lucide-react"
import { format } from "date-fns"

export const dynamic = "force-dynamic"

export default async function TenantAuditLogsPage() {
  const res = await getTenantAuditLogs()
  const logs = res.success && res.logs ? res.logs : []

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" /> Agency Activity & Audit Trail
        </h1>
        <p className="text-text-secondary text-sm">
          Track user actions, staff edits, contact modifications, and system events.
        </p>
      </div>

      <div className="bg-bg-primary rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h4 className="font-bold text-sm text-text-primary">Recent Activity Feed</h4>
        </div>

        <div className="divide-y divide-border">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-sm text-text-secondary">
              No audit logs recorded yet.
            </div>
          ) : (
            logs.map((log: any) => (
              <div key={log.id} className="p-4 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-text-primary">{log.action}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                      {log.entityType}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-text-secondary">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {log.user?.name || log.user?.email || "System"} ({log.user?.role || "Staff"})
                    </span>
                    {log.details && (
                      <>
                        <span>•</span>
                        <span>{log.details}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-xs text-text-secondary flex items-center gap-1 flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  {format(new Date(log.createdAt), "MMM d, h:mm a")}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
