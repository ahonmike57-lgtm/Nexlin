"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Plus, CheckCircle2, Send, Loader2, Sparkles, Layers } from "lucide-react"
import { createPlatformBlueprintSnapshot, deploySnapshotToAgency } from "@/app/actions/platform-admin"

interface AgencyOption {
  id: string
  name: string
  subdomain: string | null
  planTier: string
}

interface Blueprint {
  id: string
  name: string
  industry: string
  funnelsCount: number
  workflowsCount: number
  pipelinesCount: number
  description: string
  installsCount: number
  isOfficial?: boolean
}

export function SnapshotsClient({
  blueprints,
  agencies
}: {
  blueprints: Blueprint[]
  agencies: AgencyOption[]
}) {
  const [items, setItems] = useState<Blueprint[]>(blueprints)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null)
  const [targetAgencyId, setTargetAgencyId] = useState<string>(agencies[0]?.id || "")
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Create form state
  const [name, setName] = useState("")
  const [industry, setIndustry] = useState("")
  const [description, setDescription] = useState("")
  const [funnelsCount, setFunnelsCount] = useState("3")
  const [workflowsCount, setWorkflowsCount] = useState("5")
  const [pipelinesCount, setPipelinesCount] = useState("2")

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !industry || !description) return

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const res = await createPlatformBlueprintSnapshot({
        name,
        industry,
        description,
        funnelsCount: parseInt(funnelsCount) || 2,
        workflowsCount: parseInt(workflowsCount) || 4,
        pipelinesCount: parseInt(pipelinesCount) || 1
      })

      if (res.success) {
        setItems([
          {
            id: res.data?.id || `bp-${Date.now()}`,
            name,
            industry,
            description,
            funnelsCount: parseInt(funnelsCount) || 2,
            workflowsCount: parseInt(workflowsCount) || 4,
            pipelinesCount: parseInt(pipelinesCount) || 1,
            installsCount: 0,
            isOfficial: false
          },
          ...items
        ])
        setIsCreateOpen(false)
        setName("")
        setIndustry("")
        setDescription("")
        setSuccessMessage(`Blueprint "${name}" created successfully!`)
        setTimeout(() => setSuccessMessage(null), 4000)
      } else {
        setErrorMessage(res.error || "Failed to create blueprint")
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeploy = async () => {
    if (!selectedBlueprint || !targetAgencyId) return

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const res = await deploySnapshotToAgency({
        blueprintName: selectedBlueprint.name,
        agencyId: targetAgencyId
      })

      if (res.success) {
        const agencyName = agencies.find(a => a.id === targetAgencyId)?.name || "Agency"
        setSuccessMessage(`Successfully deployed "${selectedBlueprint.name}" to ${agencyName}!`)
        setSelectedBlueprint(null)
        setTimeout(() => setSuccessMessage(null), 5000)
      } else {
        setErrorMessage(res.error || "Failed to deploy snapshot")
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to deploy snapshot")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5" /> {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-semibold animate-in fade-in">
          {errorMessage}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Master Blueprint Snapshots</h1>
          <p className="text-sm text-text-secondary">Industry-standard templates auto-provisioned to new agency signups.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Blueprint Snapshot
        </Button>
      </div>

      {/* Blueprint Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((bp) => (
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
                <Button 
                  onClick={() => setSelectedBlueprint(bp)}
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Deploy to Agency
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CREATE SNAPSHOT DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Blueprint Snapshot</DialogTitle>
            <DialogDescription>
              Define a new reusable industry template with bundled funnels, workflows, and pipelines.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1">Blueprint Name</label>
              <Input 
                placeholder="e.g. MedSpa Growth & Booking Engine"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1">Industry Category</label>
              <Input 
                placeholder="e.g. Healthcare, Real Estate, E-Commerce"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1">Description</label>
              <textarea 
                className="w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                placeholder="Describe what funnels and drip campaigns are included..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">Funnels</label>
                <Input 
                  type="number"
                  value={funnelsCount}
                  onChange={(e) => setFunnelsCount(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">Workflows</label>
                <Input 
                  type="number"
                  value={workflowsCount}
                  onChange={(e) => setWorkflowsCount(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">Pipelines</label>
                <Input 
                  type="number"
                  value={pipelinesCount}
                  onChange={(e) => setPipelinesCount(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Blueprint
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DEPLOY TO AGENCY DIALOG */}
      <Dialog open={!!selectedBlueprint} onOpenChange={(open) => !open && setSelectedBlueprint(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" /> Deploy Blueprint to Agency
            </DialogTitle>
            <DialogDescription>
              Select the tenant agency workspace where <strong>{selectedBlueprint?.name}</strong> will be provisioned.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1">Target Agency Workspace</label>
              <select
                value={targetAgencyId}
                onChange={(e) => setTargetAgencyId(e.target.value)}
                className="w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {agencies.map((agency) => (
                  <option key={agency.id} value={agency.id}>
                    {agency.name} ({agency.planTier} tier)
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3.5 rounded-lg border border-border bg-bg-secondary/40 text-xs text-text-secondary space-y-1.5">
              <p className="font-semibold text-text-primary">What will be created:</p>
              <p>• {selectedBlueprint?.funnelsCount} Ready-to-use Funnels with custom paths</p>
              <p>• {selectedBlueprint?.pipelinesCount} Multi-stage Sales Pipeline</p>
              <p>• In-app system welcome notification to the Agency Owner</p>
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button variant="outline" onClick={() => setSelectedBlueprint(null)}>
              Cancel
            </Button>
            <Button onClick={handleDeploy} disabled={isLoading || !targetAgencyId} className="flex items-center gap-2">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Confirm & Deploy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
