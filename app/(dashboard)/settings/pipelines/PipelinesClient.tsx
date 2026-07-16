"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, Trash2, Edit2, GripVertical, Save } from "lucide-react"
import { createPipeline, updatePipeline, deletePipeline } from "@/app/actions/pipelines"
import { Badge } from "@/components/ui/badge"

const COLOR_OPTIONS = [
  "bg-primary/20 text-primary border-primary/30",
  "bg-warning/20 text-warning border-warning/30",
  "bg-secondary/20 text-secondary border-secondary/30",
  "bg-success/20 text-success border-success/30",
  "bg-primary-300/20 text-primary-600 border-primary-300/30",
  "bg-slate-200 text-slate-700 border-slate-300"
]

export default function PipelinesClient({ initialPipelines }: { initialPipelines: any[] }) {
  const [pipelines, setPipelines] = useState(initialPipelines)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{name: string, stages: any[]}>({ name: "", stages: [] })
  const [loading, setLoading] = useState(false)

  const handleCreateNew = () => {
    setEditingId("new")
    setEditForm({
      name: "New Pipeline",
      stages: [
        { name: "New Lead", color: COLOR_OPTIONS[0] },
        { name: "Contacted", color: COLOR_OPTIONS[1] },
        { name: "Meeting Scheduled", color: COLOR_OPTIONS[2] },
        { name: "Closed Won", color: COLOR_OPTIONS[3] },
      ]
    })
  }

  const handleEdit = (pipeline: any) => {
    setEditingId(pipeline.id)
    setEditForm({
      name: pipeline.name,
      stages: [...pipeline.stages]
    })
  }

  const handleAddStage = () => {
    setEditForm(prev => ({
      ...prev,
      stages: [...prev.stages, { name: "New Stage", color: COLOR_OPTIONS[0] }]
    }))
  }

  const handleUpdateStage = (idx: number, field: string, value: string) => {
    setEditForm(prev => {
      const newStages = [...prev.stages]
      newStages[idx] = { ...newStages[idx], [field]: value }
      return { ...prev, stages: newStages }
    })
  }

  const handleRemoveStage = (idx: number) => {
    setEditForm(prev => {
      const newStages = [...prev.stages]
      newStages.splice(idx, 1)
      return { ...prev, stages: newStages }
    })
  }

  const handleSave = async () => {
    if (!editForm.name) return alert("Pipeline name required")
    if (editForm.stages.length === 0) return alert("At least one stage required")
    
    setLoading(true)
    if (editingId === "new") {
      const res = await createPipeline(editForm.name, editForm.stages)
      if (res.success) {
        setPipelines([res.data, ...pipelines])
        setEditingId(null)
      } else {
        alert(res.error)
      }
    } else {
      const res = await updatePipeline(editingId!, editForm.name, editForm.stages)
      if (res.success) {
        // Refresh full list conceptually or just force a reload
        window.location.reload()
      } else {
        alert(res.error)
      }
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will delete the pipeline and all associated deals!")) return
    setLoading(true)
    const res = await deletePipeline(id)
    if (res.success) {
      setPipelines(pipelines.filter(p => p.id !== id))
    } else {
      alert(res.error)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleCreateNew} disabled={editingId !== null}><Plus className="w-4 h-4 mr-2" /> Create Pipeline</Button>
      </div>

      {editingId && (
        <Card className="border-primary shadow-sm">
          <CardHeader>
            <CardTitle>{editingId === "new" ? "Create Pipeline" : "Edit Pipeline"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pipeline Name</label>
              <Input 
                value={editForm.name} 
                onChange={e => setEditForm({...editForm, name: e.target.value})} 
                placeholder="e.g. Sales Pipeline" 
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Stages</label>
                <Button variant="outline" size="sm" onClick={handleAddStage}>
                  <Plus className="w-4 h-4 mr-2" /> Add Stage
                </Button>
              </div>

              <div className="space-y-3">
                {editForm.stages.map((stage, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-bg-primary/50 p-3 rounded-lg border border-border">
                    <GripVertical className="w-5 h-5 text-text-tertiary cursor-grab" />
                    <div className="flex-1">
                      <Input 
                        value={stage.name} 
                        onChange={e => handleUpdateStage(idx, "name", e.target.value)} 
                        placeholder="Stage Name"
                      />
                    </div>
                    <select 
                      className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={stage.color}
                      onChange={e => handleUpdateStage(idx, "color", e.target.value)}
                    >
                      {COLOR_OPTIONS.map((c, i) => <option key={i} value={c}>Color {i+1}</option>)}
                    </select>
                    <div className={`px-4 py-2 rounded-md border text-xs font-semibold ${stage.color}`}>
                      Preview
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveStage(idx)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Pipeline</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {pipelines.map(pipeline => (
          <Card key={pipeline.id} className={editingId === pipeline.id ? "opacity-50 pointer-events-none" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle>{pipeline.name}</CardTitle>
                <CardDescription>{pipeline.stages?.length || 0} stages</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(pipeline)}>
                  <Edit2 className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(pipeline.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mt-4">
                {pipeline.stages?.map((stage: any) => (
                  <Badge key={stage.id} className={`px-3 py-1 ${stage.color}`}>
                    {stage.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {pipelines.length === 0 && !editingId && (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
            <h3 className="text-lg font-semibold text-text-primary mb-2">No pipelines yet</h3>
            <p className="text-text-secondary mb-4">Create your first sales pipeline to track deals.</p>
            <Button onClick={handleCreateNew}><Plus className="w-4 h-4 mr-2" /> Create Pipeline</Button>
          </div>
        )}
      </div>
    </div>
  )
}
