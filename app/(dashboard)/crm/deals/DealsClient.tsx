"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Settings2, Search, Filter, MoreHorizontal, Clock, DollarSign } from "lucide-react"
import { useState } from "react"
import { updateDealStage } from "@/app/actions/deals"
import AddDealModal from "./AddDealModal"

const stages = [
  { id: "lead", name: "New Lead", amount: "$12,500", color: "bg-primary/20 text-primary border-primary/30" },
  { id: "contacted", name: "Contacted", amount: "$8,200", color: "bg-warning/20 text-warning border-warning/30" },
  { id: "meeting", name: "Meeting Scheduled", amount: "$45,000", color: "bg-secondary/20 text-secondary border-secondary/30" },
  { id: "proposal", name: "Proposal Sent", amount: "$120,000", color: "bg-primary-300/20 text-primary-600 border-primary-300/30" },
  { id: "won", name: "Closed Won", amount: "$350,000", color: "bg-success/20 text-success border-success/30" },
]

export default function DealsClient({ initialDeals, contacts = [] }: { initialDeals: any[], contacts?: any[] }) {
  const [deals, setDeals] = useState(initialDeals)

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

    // Call server action
    await updateDealStage(dealId, newStageId)
  }

  // Group deals by stage
  const dealsByStage = deals.reduce((acc: any, deal: any) => {
    if (!acc[deal.stage]) acc[deal.stage] = []
    acc[deal.stage].push(deal)
    return acc
  }, {})

  const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0)
  
  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Pipeline</h1>
          <p className="text-text-secondary">Drag and drop deals across stages.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Settings2 className="w-4 h-4 mr-2" /> Pipeline Settings</Button>
          <AddDealModal contacts={contacts} />
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
        {stages.map((stage) => {
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
                  <Badge className={`text-xs font-semibold px-2 py-0 border ${stage.color}`}>
                    {stageDeals.length}
                  </Badge>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col gap-3 bg-bg-primary/50 p-2 rounded-xl border border-border/50 overflow-y-auto">
                {stageDeals.map((deal: any) => (
                  <div 
                    key={deal.id}
                    className="bg-bg-primary p-4 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group"
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
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
    </div>
  )
}
