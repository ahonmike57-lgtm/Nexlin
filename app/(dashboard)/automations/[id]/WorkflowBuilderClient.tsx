"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Save, Play, Settings2, Plus, ArrowDown, Zap, Mail, Tag, UserPlus, Clock } from "lucide-react"

export default function WorkflowBuilderClient({ workflow }: { workflow: any }) {
  const [isSaving, setIsSaving] = useState(false)
  const triggers = workflow.triggers || []
  const actions = workflow.actions || []

  const handleSave = async () => {
    setIsSaving(true)
    // Simulating save
    await new Promise(res => setTimeout(res, 1000))
    setIsSaving(false)
  }

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case "contact_created": return <UserPlus className="w-5 h-5 text-primary" />
      case "tag_added": return <Tag className="w-5 h-5 text-primary" />
      default: return <Zap className="w-5 h-5 text-primary" />
    }
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case "send_email": return <Mail className="w-5 h-5 text-blue-500" />
      case "add_tag": return <Tag className="w-5 h-5 text-purple-500" />
      case "wait": return <Clock className="w-5 h-5 text-orange-500" />
      default: return <Settings2 className="w-5 h-5 text-gray-500" />
    }
  }

  return (
    <div className="flex flex-col h-screen -m-8 bg-bg-secondary/20">
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
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Play className="w-3 h-3 mr-2" /> Test Workflow</Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="w-3 h-3 mr-2" /> {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 overflow-auto p-12 flex flex-col items-center relative">
          
          {/* Triggers */}
          <div className="bg-bg-primary border border-border shadow-md rounded-xl p-4 w-80 mb-6 relative">
            <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div className="text-center mb-4">
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Workflow Trigger</p>
            </div>
            
            <div className="space-y-3">
              {triggers.map((t: any) => (
                <div key={t.id} className="flex items-center gap-3 p-3 bg-bg-secondary rounded-lg border border-border/50 hover:border-primary/30 cursor-pointer transition-colors">
                  <div className="w-10 h-10 rounded-md bg-white border border-border flex items-center justify-center shadow-sm">
                    {getTriggerIcon(t.type)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.type === 'contact_created' ? 'Contact Created' : t.type}</p>
                    <p className="text-xs text-text-secondary">When a new contact is added</p>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full border-dashed"><Plus className="w-3 h-3 mr-2" /> Add New Trigger</Button>
            </div>
          </div>

          <ArrowDown className="w-6 h-6 text-text-secondary/50 mb-6" />

          {/* Actions */}
          <div className="flex flex-col items-center space-y-6">
            {actions.map((a: any) => (
              <div key={a.id} className="relative flex flex-col items-center">
                <div className="bg-bg-primary border border-border shadow-sm rounded-xl p-4 w-80 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-bg-secondary border border-border flex items-center justify-center">
                        {getActionIcon(a.type)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{a.type === 'send_email' ? 'Send Email' : a.type}</p>
                        <p className="text-xs text-text-secondary truncate w-40">Welcome Email Template</p>
                      </div>
                    </div>
                  </div>
                </div>
                <ArrowDown className="w-6 h-6 text-text-secondary/50 mt-6" />
              </div>
            ))}
            
            <button className="w-12 h-12 rounded-full bg-bg-primary border-2 border-dashed border-primary/50 text-primary flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary shadow-sm transition-all group">
              <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-80 border-l border-border bg-bg-primary flex flex-col shrink-0 shadow-lg z-10">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm">Action Properties</h3>
            <Settings2 className="w-4 h-4 text-text-secondary" />
          </div>
          <div className="p-4 flex flex-col items-center justify-center h-64 text-center text-text-secondary">
            <Settings2 className="w-8 h-8 mb-3 opacity-20" />
            <p className="text-sm">Select a trigger or action to edit its properties.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
