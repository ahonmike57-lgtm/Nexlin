import { getPlatformAuditLogs } from "@/app/actions/platform-admin"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ShieldCheck, ShieldAlert, UserCheck, Key, Lock } from "lucide-react"

export default async function PlatformAuditLogsPage() {
  const res = await getPlatformAuditLogs()

  if (!res.success || !res.data) {
    return (
      <div className="p-8 text-center">
        <ShieldAlert className="w-12 h-12 text-error mx-auto mb-3" />
        <h2 className="text-xl font-bold">Access Restricted</h2>
        <p className="text-sm text-text-secondary mt-1">
          Security & Impersonation Audit Logs are restricted to Platform Owners & Developers.
        </p>
      </div>
    )
  }

  const logs = res.data

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Platform Security & Audit Logs</h1>
        <p className="text-sm text-text-secondary">Immutable record of admin actions, staff impersonations, and security events.</p>
      </div>

      <Card className="border border-border bg-bg-primary shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" /> Impersonation & Session Logs
          </CardTitle>
          <CardDescription className="text-xs">Audit log of all admin staff workspace access.</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="p-8 text-center text-text-secondary text-sm">
              <Lock className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
              No impersonation events recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-border font-mono text-xs">
              {logs.map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-text-primary">{log.adminEmail}</span>
                    <span className="text-text-secondary"> ({log.adminRole}) ➔ impersonated workspace </span>
                    <span className="font-bold text-primary">{log.agency?.name || log.agencyId}</span>
                    {log.reason && <p className="text-[11px] text-text-secondary font-sans mt-0.5">Reason: {log.reason}</p>}
                  </div>
                  <span className="text-text-secondary font-sans text-[11px]">
                    {new Date(log.startedAt).toLocaleString()}
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
