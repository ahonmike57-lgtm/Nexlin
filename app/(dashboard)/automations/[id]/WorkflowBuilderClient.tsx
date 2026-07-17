"use client"

import { useState, useCallback, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Save, Play, Plus, Zap, Mail, Tag, UserPlus, Clock, Settings2, Trash2, X } from "lucide-react"
import { addWorkflowTrigger, addWorkflowAction, deleteWorkflowTrigger, deleteWorkflowAction, updateWorkflowStatus, updateWorkflow } from "@/app/actions/automations"
import { executeWorkflow } from "@/app/actions/workflow-engine"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import ReactFlow, { Background, Controls, Node, Edge, Position, Handle, MarkerType } from "reactflow"
import "reactflow/dist/style.css"
import { toast } from "sonner"

// ── Trigger / Action definitions ─────────────────────────────────────────────
const TRIGGER_OPTIONS = [
  { type: "contact_created",  label: "Contact Created",  description: "When a new contact is added",         icon: "UserPlus" },
  { type: "tag_added",        label: "Tag Added",         description: "When a tag is applied to a contact", icon: "Tag" },
  { type: "deal_won",         label: "Deal Won",          description: "When a deal stage changes to Won",    icon: "Zap" },
  { type: "form_submitted",   label: "Form Submitted",    description: "When a form is filled out",           icon: "Mail" },
]

const ACTION_OPTIONS = [
  { type: "send_email",  label: "Send Email",    description: "Send an email to the contact",          icon: "Mail" },
  { type: "add_tag",     label: "Add Tag",       description: "Apply a tag to the contact",            icon: "Tag" },
  { type: "wait",        label: "Wait / Delay",  description: "Pause the workflow for a set time",     icon: "Clock" },
  { type: "send_sms",    label: "Send SMS",      description: "Send an SMS to the contact's phone",    icon: "Zap" },
  { type: "create_task", label: "Create Task",   description: "Create a follow-up task in CRM",        icon: "Settings2" },
]

// ── Custom Node Component ────────────────────────────────────────────────────
const WorkflowNode = ({ data }: any) => {
  const isTrigger = data.isTrigger

  const getIcon = (nodeType: string) => {
    switch (nodeType) {
      case "contact_created": case "deal_won": return <UserPlus className="w-5 h-5 text-primary" />
      case "tag_added": case "add_tag":        return <Tag className="w-5 h-5 text-primary" />
      case "send_email": case "form_submitted":return <Mail className="w-5 h-5 text-blue-500" />
      case "wait":                             return <Clock className="w-5 h-5 text-orange-500" />
      default:                                 return isTrigger ? <Zap className="w-5 h-5 text-primary" /> : <Settings2 className="w-5 h-5 text-gray-500" />
    }
  }

  return (
    <div className={`w-72 bg-bg-primary border ${isTrigger ? 'border-primary shadow-primary/20' : 'border-border'} shadow-md rounded-xl p-4 relative`}>
      {!isTrigger && <Handle type="target" position={Position.Top} className="w-3 h-3 bg-border" />}
      {isTrigger && (
        <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
          <Zap className="w-4 h-4 text-primary" />
        </div>
      )}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-md ${isTrigger ? 'bg-primary/10' : 'bg-bg-secondary'} border border-border flex items-center justify-center shadow-sm`}>
            {getIcon(data.type)}
          </div>
          <div>
            <p className="text-sm font-semibold">{data.label}</p>
            <p className="text-xs text-text-secondary truncate w-40">{data.description || "Click to configure"}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:bg-destructive/10 -mr-2 -mt-2"
          onClick={(e) => { e.stopPropagation(); data.onDelete() }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-border" />
    </div>
  )
}

// ── Add Node Modal ────────────────────────────────────────────────────────────
function AddNodeModal({ open, onClose, mode, onSelect }: {
  open: boolean
  onClose: () => void
  mode: "trigger" | "action"
  onSelect: (type: string) => void
}) {
  const options = mode === "trigger" ? TRIGGER_OPTIONS : ACTION_OPTIONS

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "trigger" ? "Add a Trigger" : "Add an Action"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-2 mt-2 max-h-[400px] overflow-y-auto pr-1">
          {options.map((opt) => (
            <button
              key={opt.type}
              onClick={() => { onSelect(opt.type); onClose() }}
              className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-bg-secondary border border-border flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:border-primary/30 transition-colors">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">{opt.label}</p>
                <p className="text-xs text-text-secondary">{opt.description}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Properties Panel ──────────────────────────────────────────────────────────
function PropertiesPanel({ selectedNode, onUpdate }: { selectedNode: any; onUpdate: (nodeId: string, data: Partial<any>) => void }) {
  if (!selectedNode) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64 text-center text-text-secondary">
        <Settings2 className="w-8 h-8 mb-3 opacity-20" />
        <p className="text-sm">Click a node to see its properties.</p>
      </div>
    )
  }

  const isTrigger = selectedNode.data.isTrigger

  return (
    <div className="p-4 space-y-4">
      <div>
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
          {isTrigger ? "Trigger" : "Action"} Settings
        </p>
        <div className="bg-bg-secondary rounded-lg p-3 border border-border">
          <p className="font-semibold text-sm">{selectedNode.data.label}</p>
          <p className="text-xs text-text-secondary mt-0.5">{selectedNode.data.description}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-text-secondary block mb-1">Label</label>
          <Input
            value={selectedNode.data.label}
            onChange={(e) => onUpdate(selectedNode.id, { label: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-text-secondary block mb-1">Description / Notes</label>
          <textarea
            value={selectedNode.data.description || ""}
            onChange={(e) => onUpdate(selectedNode.id, { description: e.target.value })}
            className="w-full min-h-[80px] text-sm rounded-md border border-border bg-bg-secondary px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="Add a note..."
          />
        </div>
        {selectedNode.data.type === "wait" && (
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">Wait Duration (hours)</label>
            <Input
              type="number"
              defaultValue={24}
              min={1}
              className="h-8 text-sm"
            />
          </div>
        )}
        {(selectedNode.data.type === "send_email" || selectedNode.data.type === "send_sms") && (
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">
              {selectedNode.data.type === "send_email" ? "Email Subject" : "SMS Message"}
            </label>
            <Input
              placeholder={selectedNode.data.type === "send_email" ? "e.g., Thanks for signing up!" : "e.g., Hi {{first_name}}, ..."}
              className="h-8 text-sm"
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function WorkflowBuilderClient({ workflow }: { workflow: any }) {
  const [isSaving, setIsSaving] = useState(false)
  const [testMessage, setTestMessage] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(workflow.status === "active")
  const [modalMode, setModalMode] = useState<"trigger" | "action" | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [nodeLabels, setNodeLabels] = useState<Record<string, any>>({})
  const router = useRouter()

  const triggers = workflow.triggers || []
  const actions = workflow.actions || []

  // Transform db data to ReactFlow nodes
  const initialNodes: Node[] = []
  const initialEdges: Edge[] = []
  let currentY = 50

  if (triggers.length > 0) {
    const trigger = triggers[0]
    const triggerDef = TRIGGER_OPTIONS.find(t => t.type === trigger.type)
    initialNodes.push({
      id: `trigger-${trigger.id}`,
      type: "workflowNode",
      position: { x: 250, y: currentY },
      data: {
        id: trigger.id,
        isTrigger: true,
        type: trigger.type,
        label: nodeLabels[`trigger-${trigger.id}`]?.label ?? (triggerDef?.label || trigger.type),
        description: nodeLabels[`trigger-${trigger.id}`]?.description ?? triggerDef?.description,
        onDelete: () => handleDeleteTrigger(trigger.id),
      }
    })
    currentY += 150
  }

  actions.forEach((action: any, index: number) => {
    const actionDef = ACTION_OPTIONS.find(a => a.type === action.type)
    initialNodes.push({
      id: `action-${action.id}`,
      type: "workflowNode",
      position: { x: 250, y: currentY },
      data: {
        id: action.id,
        isTrigger: false,
        type: action.type,
        label: nodeLabels[`action-${action.id}`]?.label ?? (actionDef?.label || action.type),
        description: nodeLabels[`action-${action.id}`]?.description ?? actionDef?.description,
        onDelete: () => handleDeleteAction(action.id),
      }
    })
    const prevId = index === 0 && triggers.length > 0
      ? `trigger-${triggers[0].id}`
      : index > 0 ? `action-${actions[index - 1].id}` : null

    if (prevId) {
      initialEdges.push({
        id: `edge-${prevId}-${action.id}`,
        source: prevId,
        target: `action-${action.id}`,
        type: "smoothstep",
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed }
      })
    }
    currentY += 150
  })

  // "Add" button node
  if (triggers.length > 0) {
    initialNodes.push({
      id: "add-action",
      type: "default",
      position: { x: 370, y: currentY - 20 },
      data: { label: '+' },
      style: { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '2px dashed #ccc', cursor: 'pointer', fontSize: 18 }
    })
    const lastNodeId = actions.length > 0 ? `action-${actions[actions.length - 1].id}` : `trigger-${triggers[0].id}`
    initialEdges.push({ id: "edge-add", source: lastNodeId, target: "add-action", type: "smoothstep", animated: true })
  } else {
    initialNodes.push({
      id: "add-trigger",
      type: "default",
      position: { x: 250, y: 50 },
      data: { label: '+ Add Trigger' },
      style: { width: 288, border: '2px dashed #ccc', cursor: 'pointer', padding: '16px', borderRadius: '12px' }
    })
  }

  const nodeTypes = useMemo(() => ({ workflowNode: WorkflowNode }), [])

  const selectedNode = initialNodes.find(n => n.id === selectedNodeId) || null

  const handleUpdateNodeData = (nodeId: string, data: Partial<any>) => {
    setNodeLabels(prev => ({ ...prev, [nodeId]: { ...(prev[nodeId] || {}), ...data } }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateWorkflow(workflow.id, { name: workflow.name })
      toast.success("Workflow saved successfully!")
    } catch {
      toast.error("Failed to save workflow.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleStatus = async (checked: boolean) => {
    setIsActive(checked)
    await updateWorkflowStatus(workflow.id, checked ? "active" : "draft")
    router.refresh()
  }

  const handleAddTrigger = async (type: string) => {
    await addWorkflowTrigger(workflow.id, type)
    router.refresh()
  }

  const handleAddAction = async (type: string) => {
    await addWorkflowAction(workflow.id, type, actions.length)
    router.refresh()
  }

  const handleDeleteTrigger = async (id: string) => {
    await deleteWorkflowTrigger(id, workflow.id)
    router.refresh()
  }

  const handleDeleteAction = async (id: string) => {
    await deleteWorkflowAction(id, workflow.id)
    router.refresh()
  }

  const onNodeClick = (_: any, node: Node) => {
    if (node.id === "add-trigger") { setModalMode("trigger"); return }
    if (node.id === "add-action") { setModalMode("action"); return }
    setSelectedNodeId(node.id === selectedNodeId ? null : node.id)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] -m-8 bg-bg-secondary/20 overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-border bg-bg-primary flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Link href="/automations">
            <Button variant="ghost" size="icon" className="w-8 h-8"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div className="h-4 w-px bg-border" />
          <h1 className="font-semibold text-sm">{workflow.name}</h1>
          <div className="ml-4 flex items-center gap-2">
            <Switch id="workflow-status" checked={isActive} onCheckedChange={handleToggleStatus} />
            <label htmlFor="workflow-status">
              {isActive
                ? <Badge className="bg-green-500 hover:bg-green-600 text-xs">Active</Badge>
                : <Badge variant="secondary" className="text-xs">Draft</Badge>}
            </label>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={async () => {
            setIsSaving(true)
            setTestMessage("Executing workflow...")
            try {
              const res = await executeWorkflow(workflow.id)
              setTestMessage(res.success ? "✅ Success!\n" + (res.logs || []).join("\n") : "❌ Failed: " + (res.error || "Unknown"))
            } catch (err: any) {
              setTestMessage("💥 Error: " + err.message)
            } finally { setIsSaving(false) }
          }} disabled={isSaving}>
            <Play className="w-3 h-3 mr-2" /> Test
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="w-3 h-3 mr-2" /> {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setModalMode("action")}>
            <Plus className="w-3 h-3 mr-2" /> Add Action
          </Button>
        </div>
      </header>

      {testMessage && (
        <div className="bg-white border-b border-border p-4 text-sm whitespace-pre-wrap font-mono shadow-inner max-h-48 overflow-auto z-10 relative">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold">Test Results:</span>
            <Button variant="ghost" size="sm" onClick={() => setTestMessage(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          {testMessage}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* React Flow Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={initialNodes}
            edges={initialEdges}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#ccc" gap={16} />
            <Controls />
          </ReactFlow>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-80 border-l border-border bg-bg-primary flex flex-col shrink-0 shadow-lg z-10">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm">Properties</h3>
            <Settings2 className="w-4 h-4 text-text-secondary" />
          </div>
          <div className="flex-1 overflow-y-auto">
            <PropertiesPanel selectedNode={selectedNode} onUpdate={handleUpdateNodeData} />
          </div>
          <div className="p-4 border-t border-border space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setModalMode(triggers.length === 0 ? "trigger" : "action")}
            >
              <Plus className="w-4 h-4 mr-2" />
              {triggers.length === 0 ? "Add Trigger" : "Add Action"}
            </Button>
          </div>
        </div>
      </div>

      {/* Add Node Modal */}
      <AddNodeModal
        open={modalMode !== null}
        onClose={() => setModalMode(null)}
        mode={modalMode || "action"}
        onSelect={modalMode === "trigger" ? handleAddTrigger : handleAddAction}
      />
    </div>
  )
}
