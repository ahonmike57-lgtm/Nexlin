"use client"

import { useState, useCallback, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Play, Plus, Zap, Mail, Tag, UserPlus, Clock, Settings2, Trash2 } from "lucide-react"
import { addWorkflowTrigger, addWorkflowAction, deleteWorkflowTrigger, deleteWorkflowAction, updateWorkflowStatus } from "@/app/actions/automations"
import { executeWorkflow } from "@/app/actions/workflow-engine"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import ReactFlow, { Background, Controls, Node, Edge, Position, Handle, MarkerType } from "reactflow"
import "reactflow/dist/style.css"

// Custom Node Component
const WorkflowNode = ({ data, type }: any) => {
  const isTrigger = data.isTrigger
  
  const getIcon = (nodeType: string) => {
    switch (nodeType) {
      case "contact_created": return <UserPlus className="w-5 h-5 text-primary" />
      case "tag_added": return <Tag className="w-5 h-5 text-primary" />
      case "send_email": return <Mail className="w-5 h-5 text-blue-500" />
      case "wait": return <Clock className="w-5 h-5 text-orange-500" />
      default: return isTrigger ? <Zap className="w-5 h-5 text-primary" /> : <Settings2 className="w-5 h-5 text-gray-500" />
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
          <div className={`w-10 h-10 rounded-md ${isTrigger ? 'bg-white' : 'bg-bg-secondary'} border border-border flex items-center justify-center shadow-sm`}>
            {getIcon(data.type)}
          </div>
          <div>
            <p className="text-sm font-semibold">{data.label}</p>
            <p className="text-xs text-text-secondary truncate w-40">{data.description || "Configuration needed"}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-destructive hover:bg-destructive/10 -mr-2 -mt-2"
          onClick={(e) => { e.stopPropagation(); data.onDelete(); }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-border" />
    </div>
  )
}

export default function WorkflowBuilderClient({ workflow }: { workflow: any }) {
  const [isSaving, setIsSaving] = useState(false)
  const [testMessage, setTestMessage] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(workflow.status === "active")
  const router = useRouter()
  
  const triggers = workflow.triggers || []
  const actions = workflow.actions || []

  // Transform db data to ReactFlow nodes
  const initialNodes: Node[] = []
  const initialEdges: Edge[] = []
  
  let currentY = 50
  
  // Create Trigger Node
  if (triggers.length > 0) {
    const trigger = triggers[0] // Simplify: 1 main trigger for visual
    initialNodes.push({
      id: `trigger-${trigger.id}`,
      type: "workflowNode",
      position: { x: 250, y: currentY },
      data: { 
        id: trigger.id,
        isTrigger: true, 
        type: trigger.type,
        label: trigger.type === 'contact_created' ? 'Contact Created' : trigger.type,
        description: "When a new contact is added",
        onDelete: () => handleDeleteTrigger(trigger.id)
      }
    })
    currentY += 150
  }

  // Create Action Nodes
  actions.forEach((action: any, index: number) => {
    initialNodes.push({
      id: `action-${action.id}`,
      type: "workflowNode",
      position: { x: 250, y: currentY },
      data: {
        id: action.id,
        isTrigger: false,
        type: action.type,
        label: action.type === 'send_email' ? 'Send Email' : action.type,
        description: "Wait or execute action",
        onDelete: () => handleDeleteAction(action.id)
      }
    })
    
    // Create edge from previous node
    const prevId = index === 0 && triggers.length > 0 
      ? `trigger-${triggers[0].id}` 
      : index > 0 ? `action-${actions[index-1].id}` : null
      
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

  // Plus button node
  if (triggers.length > 0) {
    initialNodes.push({
      id: "add-action",
      type: "default",
      position: { x: 370, y: currentY - 20 },
      data: { label: '+' },
      style: { 
        width: 32, 
        height: 32, 
        borderRadius: '50%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#fff',
        border: '2px dashed #ccc',
        cursor: 'pointer'
      }
    })
    
    const lastNodeId = actions.length > 0 ? `action-${actions[actions.length-1].id}` : `trigger-${triggers[0].id}`
    initialEdges.push({
      id: "edge-add",
      source: lastNodeId,
      target: "add-action",
      type: "smoothstep",
      animated: true
    })
  } else {
    // Add trigger button
    initialNodes.push({
      id: "add-trigger",
      type: "default",
      position: { x: 250, y: 50 },
      data: { label: '+ Add Trigger' },
      style: { width: 288, border: '2px dashed #ccc', cursor: 'pointer' }
    })
  }

  const nodeTypes = useMemo(() => ({ workflowNode: WorkflowNode }), [])

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise(res => setTimeout(res, 1000))
    setIsSaving(false)
  }

  const handleToggleStatus = async (checked: boolean) => {
    setIsActive(checked)
    await updateWorkflowStatus(workflow.id, checked ? "active" : "draft")
    router.refresh()
  }

  const handleAddTrigger = async () => {
    const type = prompt("Enter trigger type (e.g. contact_created, tag_added):", "contact_created")
    if (type) {
      await addWorkflowTrigger(workflow.id, type)
      router.refresh()
    }
  }

  const handleAddAction = async () => {
    const type = prompt("Enter action type (e.g. send_email, wait, add_tag):", "send_email")
    if (type) {
      await addWorkflowAction(workflow.id, type, actions.length)
      router.refresh()
    }
  }

  const handleDeleteTrigger = async (id: string) => {
    if (!confirm("Remove this trigger?")) return
    await deleteWorkflowTrigger(id, workflow.id)
    router.refresh()
  }

  const handleDeleteAction = async (id: string) => {
    if (!confirm("Remove this action?")) return
    await deleteWorkflowAction(id, workflow.id)
    router.refresh()
  }

  const onNodeClick = (_: any, node: Node) => {
    if (node.id === 'add-trigger') handleAddTrigger()
    if (node.id === 'add-action') handleAddAction()
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] -m-8 bg-bg-secondary/20 overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-border bg-bg-primary flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Link href="/automations">
            <Button variant="ghost" size="icon" className="w-8 h-8"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div className="h-4 w-px bg-border"></div>
          <div>
            <h1 className="font-semibold text-sm">{workflow.name}</h1>
          </div>
          <div className="ml-4 flex items-center gap-2">
            <Switch 
              id="workflow-status" 
              checked={isActive} 
              onCheckedChange={handleToggleStatus} 
            />
            <label htmlFor="workflow-status" className="text-xs font-medium">
              {isActive ? <Badge className="bg-green-500 hover:bg-green-600">Active</Badge> : <Badge variant="secondary">Draft</Badge>}
            </label>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={async () => {
            setIsSaving(true)
            setTestMessage("Executing workflow...")
            try {
              const res = await executeWorkflow(workflow.id)
              if (res.success && res.logs) {
                setTestMessage("Success!\n" + res.logs.join("\n"))
              } else {
                setTestMessage("Failed! Error: " + (res.error || "Unknown"))
              }
            } catch (err: any) {
              setTestMessage("Critical Error: " + err.message)
            } finally {
              setIsSaving(false)
            }
          }} disabled={isSaving}>
            <Play className="w-3 h-3 mr-2" /> Test Workflow
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="w-3 h-3 mr-2" /> {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </header>

      {testMessage && (
        <div className="bg-white border-b border-border p-4 text-sm whitespace-pre-wrap font-mono shadow-inner max-h-48 overflow-auto z-10 relative">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold">Test Results:</span>
            <Button variant="ghost" size="sm" onClick={() => setTestMessage(null)}>Clear</Button>
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
          <div className="p-4 flex flex-col items-center justify-center h-64 text-center text-text-secondary">
            <Settings2 className="w-8 h-8 mb-3 opacity-20" />
            <p className="text-sm">Select a node to edit.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
