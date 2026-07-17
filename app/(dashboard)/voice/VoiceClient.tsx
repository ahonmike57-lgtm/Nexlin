"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Mic, Save, Play, Settings, Webhook, PhoneCall } from "lucide-react"
import { saveVoiceAgent } from "@/app/actions/voice"
import { toast } from "sonner"

export default function VoiceClient({ initialAgents, agencyId }: { initialAgents: any[], agencyId: string }) {
  const [agents, setAgents] = useState(initialAgents)
  const defaultAgent = agents[0] || {
    name: "Front Desk Assistant",
    systemPrompt: "You are a helpful front desk assistant for our agency. You can answer common questions and route calls. Always be polite.",
    voiceId: "eleven_monolingual_v1_rachel",
    greeting: "Hello! Thank you for calling. How can I help you today?",
    isActive: false
  }

  const [form, setForm] = useState(defaultAgent)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await saveVoiceAgent(agencyId, form)
      if (res.success) {
        toast.success("Voice Agent configuration saved!")
        if (!form.id) {
          setForm(res.agent)
          setAgents([res.agent])
        }
      } else {
        toast.error("Failed to save configuration")
      }
    } catch (e) {
      toast.error("An error occurred")
    }
    setIsSaving(false)
  }

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Voice Agent</h1>
          <p className="text-text-secondary">Configure an AI assistant to handle incoming calls 24/7.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => toast.info("Call simulation coming soon!")}>
            <PhoneCall className="w-4 h-4 mr-2" /> Test Call
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" /> {isSaving ? "Saving..." : "Save Agent"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Config */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-bg-secondary border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-primary" /> General Configuration
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Agent Name</label>
                <Input 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  placeholder="e.g. Sales Representative" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Greeting Message</label>
                <Input 
                  value={form.greeting} 
                  onChange={e => setForm({...form, greeting: e.target.value})} 
                  placeholder="What should the AI say first when answering?" 
                />
                <p className="text-xs text-text-secondary mt-1">This is spoken immediately when the call connects.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">System Prompt (Instructions)</label>
                <textarea 
                  className="w-full min-h-[200px] flex rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={form.systemPrompt}
                  onChange={e => setForm({...form, systemPrompt: e.target.value})}
                  placeholder="Tell the AI how to behave, what it knows, and how to handle specific situations..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Config */}
        <div className="space-y-6">
          <div className="bg-bg-secondary border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Mic className="w-5 h-5 text-primary" /> Voice Profile
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select Voice</label>
                <select 
                  className="w-full flex h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.voiceId}
                  onChange={e => setForm({...form, voiceId: e.target.value})}
                >
                  <option value="eleven_monolingual_v1_rachel">Rachel (American, Female, Calm)</option>
                  <option value="eleven_monolingual_v1_drew">Drew (American, Male, News)</option>
                  <option value="eleven_monolingual_v1_clyde">Clyde (American, Male, War veteran)</option>
                  <option value="eleven_monolingual_v1_mimi">Mimi (British, Female, Childish)</option>
                </select>
              </div>
              <div className="p-3 bg-bg-primary rounded-lg border border-border flex items-center justify-between">
                <span className="text-sm font-medium">Sample Audio</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Play className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-bg-secondary border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Webhook className="w-5 h-5 text-primary" /> Integration
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <button 
                  onClick={() => setForm({...form, isActive: !form.isActive})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? 'bg-primary' : 'bg-text-secondary/30'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-text-secondary mb-2">To connect this agent to a phone number, assign it in the phone numbers settings or build a routing Flow.</p>
                {form.isActive ? (
                   <Badge className="bg-success/10 text-success hover:bg-success/20 w-full justify-center py-1">Agent is Live</Badge>
                ) : (
                  <Badge variant="outline" className="w-full justify-center py-1">Agent is Offline</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
