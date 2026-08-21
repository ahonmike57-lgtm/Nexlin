import { getPlatformBlueprintSnapshots } from "@/app/actions/platform-admin"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Layers, Plus, Sparkles, CheckCircle2, ShieldAlert } from "lucide-react"

export default async function PlatformSnapshotsPage() {
  const res = await getPlatformBlueprintSnapshots()

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
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Master Blueprint Snapshots</h1>
          <p className="text-sm text-text-secondary">Industry-standard templates auto-provisioned to new agency signups.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Blueprint Snapshot
        </Button>
      </div>

      {/* Blueprint Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {blueprintTemplates.map((bp) => (
          <Card key={bp.id} className="border border-border bg-bg-primary shadow-sm hover:border-primary/40 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wider">
                    {bp.industry}
                  </span>
                  <CardTitle className="text-base font-semibold mt-2 text-text-primary">{bp.name}</CardTitle>
                </div>
                {bp.isOfficial && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Official
                  </span>
                )}
              </div>
              <CardDescription className="text-xs text-text-secondary mt-1 line-clamp-2">
                {bp.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-4 py-3 border-y border-border text-xs text-text-secondary">
                <span>⚡ {bp.funnelsCount} Funnels</span>
                <span>🔄 {bp.workflowsCount} Automations</span>
                <span>📊 {bp.pipelinesCount} Pipelines</span>
              </div>
              <div className="flex items-center justify-between pt-3">
                <span className="text-xs text-text-secondary font-medium">{bp.installsCount} Agencies Provisioned</span>
                <Button variant="outline" size="sm">
                  Deploy / Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
