"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Plus, Play, DownloadCloud, Clock } from "lucide-react"
import { createSnapshot, getSnapshots, deploySnapshot } from "@/app/actions/snapshots"

export default function SnapshotsClient({ 
  agencyId, 
  subAgencies 
}: { 
  agencyId: string, 
  subAgencies: { id: string, name: string }[] 
}) {
  const [snapshots, setSnapshots] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [deployingId, setDeployingId] = useState<string | null>(null)
  
  // State for creating snapshot
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [showCreate, setShowCreate] = useState(false)

  // State for deploying snapshot
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null)
  const [selectedSubAgencyId, setSelectedSubAgencyId] = useState<string>("")

  useEffect(() => {
    loadSnapshots()
  }, [])

  const loadSnapshots = async () => {
    setIsLoading(true)
    const res = await getSnapshots(agencyId)
    if (res.success && res.data) {
      setSnapshots(res.data)
    }
    setIsLoading(false)
  }

  const handleCreate = async () => {
    if (!newName) return
    setIsCreating(true)
    const res = await createSnapshot(agencyId, newName, newDesc)
    if (res.success) {
      setNewName("")
      setNewDesc("")
      setShowCreate(false)
      loadSnapshots()
    } else {
      alert("Failed to create snapshot")
    }
    setIsCreating(false)
  }

  const handleDeploy = async () => {
    if (!selectedSnapshotId || !selectedSubAgencyId) return
    setDeployingId(selectedSnapshotId)
    const res = await deploySnapshot(selectedSnapshotId, selectedSubAgencyId, agencyId)
    if (res.success) {
      alert("Snapshot deployed successfully to the selected sub-account!")
      setSelectedSnapshotId(null)
    } else {
      alert("Failed to deploy snapshot")
    }
    setDeployingId(null)
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Account Snapshots</h2>
          <p className="text-text-secondary">Package your funnels, workflows, and pipelines to instantly deploy to new clients.</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="w-4 h-4 mr-2" /> Create Snapshot
        </Button>
      </div>

      {showCreate && (
        <Card className="border-primary/50 shadow-sm">
          <CardHeader>
            <CardTitle>New Snapshot</CardTitle>
            <CardDescription>This will instantly bundle all agency-level funnels, workflows, and pipelines.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Snapshot Name</label>
              <input 
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Real Estate Starter Pack"
                className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <input 
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Brief description of what this includes..."
                className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={isCreating || !newName}>
                {isCreating ? "Creating..." : "Save Snapshot"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedSnapshotId && (
        <Card className="border-secondary/50 shadow-sm bg-secondary/5">
          <CardHeader>
            <CardTitle>Deploy Snapshot</CardTitle>
            <CardDescription>Select a sub-account to push these assets into.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Target Sub-Account</label>
              <select 
                value={selectedSubAgencyId}
                onChange={e => setSelectedSubAgencyId(e.target.value)}
                className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm"
              >
                <option value="">Select a sub-account...</option>
                {subAgencies.map(sa => (
                  <option key={sa.id} value={sa.id}>{sa.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setSelectedSnapshotId(null)}>Cancel</Button>
              <Button onClick={handleDeploy} disabled={!!deployingId || !selectedSubAgencyId} className="bg-secondary hover:bg-secondary/90">
                {deployingId === selectedSnapshotId ? "Deploying..." : "Push to Sub-Account"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-text-secondary">Loading snapshots...</div>
      ) : snapshots.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl bg-bg-secondary/30">
          <Package className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">No snapshots found</h3>
          <p className="text-text-secondary max-w-sm mx-auto mb-6">Create your first snapshot to start scaling your agency deployments faster.</p>
          <Button onClick={() => setShowCreate(true)}>Create First Snapshot</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {snapshots.map(snapshot => (
            <Card key={snapshot.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{snapshot.name}</h3>
                      <p className="text-xs text-text-secondary flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        v{snapshot.version} • Created {new Date(snapshot.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={snapshot.isPublic ? "success" : "secondary"}>
                    {snapshot.isPublic ? "Public" : "Private"}
                  </Badge>
                </div>
                
                {snapshot.description && (
                  <p className="text-sm text-text-secondary mb-6 line-clamp-2">
                    {snapshot.description}
                  </p>
                )}
                
                <div className="grid grid-cols-2 gap-4 mb-6 py-4 border-y border-border">
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Bundled Assets</p>
                    <p className="font-medium">{snapshot._count.assets} Items</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Status</p>
                    <p className="font-medium text-success flex items-center gap-1">
                      <Play className="w-3 h-3 fill-current" /> Ready
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    className="flex-1" 
                    onClick={() => setSelectedSnapshotId(snapshot.id)}
                    disabled={selectedSnapshotId === snapshot.id}
                  >
                    <DownloadCloud className="w-4 h-4 mr-2" /> Deploy
                  </Button>
                  <Button variant="outline" className="flex-1">Edit</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
