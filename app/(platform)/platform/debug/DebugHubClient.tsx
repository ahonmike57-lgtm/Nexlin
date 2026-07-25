"use client"

import { useState } from "react"
import { getTenantInspectionDetails, exportAuditLogs } from "@/app/actions/debug"
import { toast } from "sonner"
import { 
  Terminal, 
  Activity, 
  Search, 
  ShieldCheck, 
  Cpu, 
  Webhook, 
  Layers, 
  Users, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Building2,
  Download
} from "lucide-react"
import { format } from "date-fns"

interface DebugHubClientProps {
  logsData: {
    impersonationLogs: any[]
    usageLogs: any[]
    webhooks: any[]
    tenantApps: any[]
  }
  tenantsList: any[]
}

export function DebugHubClient({ logsData, tenantsList }: DebugHubClientProps) {
  const [activeTab, setActiveTab] = useState<"logs" | "inspector">("logs")
  const [selectedTenantId, setSelectedTenantId] = useState(tenantsList[0]?.id || "")
  const [inspecting, setInspecting] = useState(false)
  const [inspectionData, setInspectionData] = useState<any>(null)

  const handleInspectTenant = async (id: string) => {
    setSelectedTenantId(id)
    setInspecting(true)
    try {
      const res = await getTenantInspectionDetails(id)
      if (res.success && res.agency) {
        setInspectionData(res.agency)
      } else {
        toast.error(res.error || "Failed to inspect tenant")
      }
    } catch (err: any) {
      toast.error("Error inspecting tenant")
    } finally {
      setInspecting(false)
    }
  }

  const handleExportCsv = async (logType: "impersonation" | "usage") => {
    const res = await exportAuditLogs(logType)
    if (res.success && res.csvContent && res.filename) {
      const blob = new Blob([res.csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = res.filename
      a.click()
      toast.success(`Exported ${res.filename}`)
    } else {
      toast.error(res.error || "Failed to export logs")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Branding */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <Terminal className="w-7 h-7 text-primary" />
            Developer Debug & System Audit Hub
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Real-time audit streams, cross-tenant data inspection, and system metrics for technical troubleshooting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportCsv("impersonation")}
            className="px-3 py-2 bg-bg-primary border border-border text-text-primary hover:bg-primary/10 hover:text-primary text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" /> Export Audit CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab("logs")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "logs"
              ? "bg-primary text-white shadow-md"
              : "bg-bg-primary text-text-secondary hover:text-text-primary border border-border"
          }`}
        >
          <Activity className="w-4 h-4" /> System & Audit Logs
        </button>

        <button
          onClick={() => {
            setActiveTab("inspector")
            if (!inspectionData && selectedTenantId) {
              handleInspectTenant(selectedTenantId)
            }
          }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "inspector"
              ? "bg-primary text-white shadow-md"
              : "bg-bg-primary text-text-secondary hover:text-text-primary border border-border"
          }`}
        >
          <Database className="w-4 h-4" /> Cross-Tenant Inspector
        </button>
      </div>

      {/* TAB 1: System & Audit Logs */}
      {activeTab === "logs" && (
        <div className="space-y-6">
          {/* Impersonation Audit Logs */}
          <div className="rounded-xl border border-border bg-bg-primary shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" /> Impersonation Audit Trail
              </h2>
              <span className="text-xs text-text-secondary bg-bg-secondary px-2.5 py-1 rounded-full border border-border">
                {logsData.impersonationLogs.length} Events Logged
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold text-text-secondary">
                    <th className="p-3">Admin</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Target Tenant</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Started</th>
                    <th className="p-3">Ended</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logsData.impersonationLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-text-secondary text-xs">
                        No impersonation events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    logsData.impersonationLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-bg-secondary/50 transition-colors">
                        <td className="p-3 font-semibold text-text-primary">{log.adminEmail}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-primary/10 text-primary border border-primary/20">
                            {log.adminRole}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-text-primary">{log.agency?.name || log.agencyId}</td>
                        <td className="p-3 text-text-secondary text-xs">{log.reason || "Support Session"}</td>
                        <td className="p-3 text-text-secondary text-xs">{format(new Date(log.startedAt), "MMM d, h:mm a")}</td>
                        <td className="p-3 text-text-secondary text-xs">
                          {log.endedAt ? (
                            <span className="text-success font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Closed
                            </span>
                          ) : (
                            <span className="text-warning font-medium flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Active
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Usage & Metered Deductions */}
          <div className="rounded-xl border border-border bg-bg-primary shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <Cpu className="w-5 h-5 text-primary" /> Usage & Metered Deduction Stream
              </h2>
              <span className="text-xs text-text-secondary bg-bg-secondary px-2.5 py-1 rounded-full border border-border">
                {logsData.usageLogs.length} Records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold text-text-secondary">
                    <th className="p-3">Usage Type</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Base Cost</th>
                    <th className="p-3">Billed Charge</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logsData.usageLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-text-secondary text-xs">
                        No metered usage logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    logsData.usageLogs.map((usage) => (
                      <tr key={usage.id} className="hover:bg-bg-secondary/50 transition-colors">
                        <td className="p-3 font-semibold uppercase text-xs text-primary">{usage.type}</td>
                        <td className="p-3 font-mono">{usage.amount}</td>
                        <td className="p-3 text-text-secondary">${usage.cost.toFixed(4)}</td>
                        <td className="p-3 font-bold text-success">${usage.markup.toFixed(4)}</td>
                        <td className="p-3 text-text-secondary text-xs">{format(new Date(usage.createdAt), "MMM d, h:mm a")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Cross-Tenant Inspector */}
      {activeTab === "inspector" && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-bg-primary border border-border flex items-center gap-4">
            <label className="text-sm font-semibold text-text-primary whitespace-nowrap flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" /> Select Tenant to Inspect:
            </label>
            <select
              value={selectedTenantId}
              onChange={(e) => handleInspectTenant(e.target.value)}
              className="w-full max-w-md px-3 py-2 rounded-lg bg-bg-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {tenantsList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.subdomain}) - Tier: {t.planTier.toUpperCase()}
                </option>
              ))}
            </select>
            {inspecting && <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />}
          </div>

          {inspectionData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tenant Overview Card */}
              <div className="p-6 rounded-xl bg-bg-primary border border-border space-y-4 shadow-sm">
                <h3 className="text-lg font-bold text-text-primary border-b border-border pb-2 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" /> Tenant Profile
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Agency ID:</span>
                    <span className="font-mono text-xs text-text-primary">{inspectionData.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Subdomain:</span>
                    <span className="font-semibold text-primary">{inspectionData.subdomain}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Plan Tier:</span>
                    <span className="uppercase text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {inspectionData.planTier}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Status:</span>
                    <span className="capitalize font-semibold text-success">{inspectionData.status}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border space-y-2">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Metrics Count</h4>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 rounded bg-bg-secondary border border-border">
                      <div className="font-bold text-lg text-text-primary">{inspectionData._count?.contacts || 0}</div>
                      <div className="text-text-secondary">Contacts</div>
                    </div>
                    <div className="p-2 rounded bg-bg-secondary border border-border">
                      <div className="font-bold text-lg text-text-primary">{inspectionData._count?.deals || 0}</div>
                      <div className="text-text-secondary">Deals</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Installed Apps & Webhooks */}
              <div className="p-6 rounded-xl bg-bg-primary border border-border space-y-4 shadow-sm lg:col-span-2">
                <h3 className="text-lg font-bold text-text-primary border-b border-border pb-2 flex items-center gap-2">
                  <Webhook className="w-5 h-5 text-primary" /> Configured Webhooks & Integrations
                </h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-text-secondary uppercase mb-2">Webhooks ({inspectionData.webhooks?.length || 0})</h4>
                    {inspectionData.webhooks?.length === 0 ? (
                      <p className="text-xs text-text-secondary italic">No custom webhooks configured.</p>
                    ) : (
                      <div className="space-y-2">
                        {inspectionData.webhooks?.map((w: any) => (
                          <div key={w.id} className="p-3 rounded-lg bg-bg-secondary border border-border flex items-center justify-between">
                            <span className="font-mono text-xs text-text-primary truncate max-w-xs">{w.url}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase">
                              {w.event}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h4 className="text-xs font-bold text-text-secondary uppercase mb-2">Installed Apps ({inspectionData.tenantApps?.length || 0})</h4>
                    {inspectionData.tenantApps?.length === 0 ? (
                      <p className="text-xs text-text-secondary italic">No Marketplace apps installed.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {inspectionData.tenantApps?.map((app: any) => (
                          <div key={app.id} className="p-3 rounded-lg bg-bg-secondary border border-border flex items-center gap-2">
                            <Layers className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-xs font-medium text-text-primary truncate">{app.app?.name || "Marketplace App"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
