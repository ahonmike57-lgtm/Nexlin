"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Settings2, Search, Filter, MoreHorizontal, Clock, DollarSign, Grip } from "lucide-react"
import { useState, useEffect } from "react"
import { updateDealStage } from "@/app/actions/deals"
import AddDealModal from "./AddDealModal"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import DealDetailsSheet from "./DealDetailsSheet"

const DEFAULT_STAGES = [
  { id: "lead", name: "New Lead", amount: "$12,500", color: "bg-primary/20 text-primary border-primary/30" },
  { id: "contacted", name: "Contacted", amount: "$8,200", color: "bg-warning/20 text-warning border-warning/30" },
  { id: "meeting", name: "Meeting Scheduled", amount: "$45,000", color: "bg-secondary/20 text-secondary border-secondary/30" },
  { id: "proposal", name: "Proposal Sent", amount: "$120,000", color: "bg-primary-300/20 text-primary-600 border-primary-300/30" },
  { id: "won", name: "Closed Won", amount: "$350,000", color: "bg-success/20 text-success border-success/30" },
]

export default function DealsClient({ initialDeals, contacts = [], pipelines = [] }: { initialDeals: any[], contacts?: any[], pipelines?: any[] }) {
  const [deals, setDeals] = useState(initialDeals)
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>(pipelines[0]?.id || "default")
  const [selectedDeal, setSelectedDeal] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    setDeals(initialDeals)
  }, [initialDeals])

  const currentPipeline = pipelines.find(p => p.id === selectedPipelineId)
  
  // Use dynamic stages if a pipeline is selected, otherwise fallback to default
  const stages = currentPipeline?.stages?.length > 0 
    ? currentPipeline.stages 
    : DEFAULT_STAGES

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData("dealId", dealId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault() // Required to allow dropping
  }

  const handleDrop = async (e: React.DragEvent, newStageId: string) => {
    e.preventDefault()
    const dealId = e.dataTransfer.getData("dealId")
    
    // Optimistic UI update
    setDeals(prevDeals => 
      prevDeals.map(deal => 
        deal.id === dealId ? { ...deal, stage: newStageId } : deal
      )
    )

    // Call server action (stage could be legacy string or new stageId)
    await updateDealStage(dealId, newStageId)
  }

  // Filter deals to only show ones in the current pipeline stages
  // If we are on default pipeline, show deals whose stage is in DEFAULT_STAGES
  // If we are on custom pipeline, show deals whose stage is in currentPipeline.stages
  const currentStageIds = stages.map((s: any) => s.id)
  const visibleDeals = deals.filter(d => currentStageIds.includes(d.stage))

  // Group deals by stage
  const dealsByStage = visibleDeals.reduce((acc: any, deal: any) => {
    if (!acc[deal.stage]) acc[deal.stage] = []
    acc[deal.stage].push(deal)
    return acc
  }, {})

  const totalValue = visibleDeals.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0)
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Pipeline</h1>
          <p className="text-text-secondary">Drag and drop deals across stages.</p>
        </div>
        <div className="flex gap-2">
          {pipelines.length > 0 && (
            <div className="w-[200px]">
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={selectedPipelineId}
                onChange={(e) => setSelectedPipelineId(e.target.value)}
              >
                {pipelines.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
                <option value="default">Default (Legacy)</option>
              </select>
            </div>
          )}
          <Button variant="outline" onClick={() => router.push("/settings/pipelines")}>
            <Settings2 className="w-4 h-4 mr-2" /> Pipeline Settings
          </Button>
          <AddDealModal contacts={contacts} stages={stages} />
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input 
            type="text" 
            placeholder="Search deals..." 
            className="w-full pl-9 pr-4 py-2 bg-bg-primary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <Button variant="outline" className="bg-bg-primary"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
        
        <div className="ml-auto text-sm font-medium text-text-secondary flex items-center gap-4">
          <span>Total Pipeline Value: <span className="text-text-primary font-bold">${totalValue.toLocaleString()}</span></span>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {stages.map((stage: any) => {
          const stageDeals = dealsByStage[stage.id] || []
          
          return (
            <div 
              key={stage.id} 
              className="min-w-[300px] w-[300px] flex flex-col"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">{stage.name}</h3>
                  <Badge className={`text-xs font-semibold px-2 py-0 border ${stage.color || 'bg-slate-100 text-slate-800'}`}>
                    {stageDeals.length}
                  </Badge>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col gap-3 bg-bg-primary/50 p-2 rounded-xl border border-border/50 overflow-y-auto">
                {stageDeals.map((deal: any) => (
                  <div 
                    key={deal.id}
                    className="bg-bg-primary p-4 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group relative"
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal.id)}
                    onClick={() => setSelectedDeal(deal)}
                  >
                    {/* Make cursor a pointer on the whole card, but keep drag active */}
                    <div className="absolute inset-0 cursor-pointer z-0"></div>
                    <div className="relative z-10 flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-sm text-text-primary group-hover:text-primary transition-colors">{deal.title}</h4>
                      <Button variant="ghost" size="icon" className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-2">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <p className="text-xs text-text-secondary mb-4">{deal.contact?.company || deal.contact?.firstName || "No Contact"}</p>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center text-xs font-medium text-text-primary">
                        <DollarSign className="w-3 h-3 text-success mr-1" />
                        {deal.value?.toLocaleString() || "0"}
                      </div>
                      <div className="flex items-center text-xs text-text-secondary">
                        <Clock className="w-3 h-3 mr-1" />
                        {Math.floor((Date.now() - new Date(deal.updatedAt).getTime()) / (1000 * 60 * 60 * 24))} days
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {selectedDeal && (
        <DealDetailsSheet 
          deal={selectedDeal} 
          onClose={() => setSelectedDeal(null)} 
        />
      )}
    </div>
  )
}
