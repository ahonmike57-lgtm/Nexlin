"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, MoreVertical, Settings, Play, Pause } from "lucide-react"
import { createWorkflow } from "@/app/actions/automations"

export default function AutomationsClient({ initialWorkflows, agencyId }: { initialWorkflows: any[], agencyId: string }) {
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  const handleCreate = async () => {
    setIsCreating(true)
    const res = await createWorkflow(agencyId, "New Workflow")
    if (res.success && res.data) {
      router.push(`/automations/${res.data.id}`)
    } else {
      setIsCreating(false)
    }
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automations & Workflows</h1>
          <p className="text-text-secondary">Build automated sequences to save time and convert leads.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreate} disabled={isCreating}>
            <Plus className="w-4 h-4 mr-2" /> {isCreating ? "Creating..." : "Create Workflow"}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 py-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input 
            type="text" 
            placeholder="Search workflows..." 
            className="w-full pl-9 pr-4 py-2 bg-bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialWorkflows.map((workflow) => (
          <Link key={workflow.id} href={`/automations/${workflow.id}`}>
            <Card className="hover:shadow-md transition-shadow group cursor-pointer border border-border">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-text-primary group-hover:text-primary transition-colors">{workflow.name}</h3>
                    <p className="text-xs text-text-secondary mt-1">
                      {workflow.triggers?.length || 0} Triggers, {workflow.actions?.length || 0} Actions
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-2">
                    <MoreVertical className="w-4 h-4 text-text-secondary" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2 pt-4 border-t border-border">
                  <Badge variant={workflow.status === 'active' ? 'success' : 'secondary'} className="px-2 py-0 flex items-center gap-1">
                    {workflow.status === 'active' ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                    {workflow.status === 'active' ? 'Active' : 'Draft'}
                  </Badge>
                  <span className="text-xs font-medium text-text-secondary ml-auto flex items-center gap-1">
                    <Settings className="w-3 h-3" /> Configured
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        <div onClick={handleCreate} className="h-full border-2 border-dashed border-border bg-bg-secondary/50 hover:bg-primary/5 hover:border-primary/50 transition-colors cursor-pointer group flex flex-col items-center justify-center p-6 min-h-[160px]">
          <div className="w-12 h-12 rounded-full bg-bg-primary border border-border flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-primary/50 group-hover:text-primary transition-all">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors">Create New Workflow</h3>
        </div>
      </div>
    </div>
  )
}
