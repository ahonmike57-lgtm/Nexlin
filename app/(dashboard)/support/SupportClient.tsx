"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Filter, MessageSquare, AlertCircle, CheckCircle2, Clock, Inbox } from "lucide-react"
import { createTicket, updateTicketStatus } from "@/app/actions/support"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function SupportClient({ initialTickets, agencyId }: { initialTickets: any[], agencyId: string }) {
  const [tickets, setTickets] = useState(initialTickets)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all") // all, open, pending, resolved
  
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false)
  const [newTicketForm, setNewTicketForm] = useState({ title: "", description: "", priority: "normal" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateTicket = async () => {
    if (!newTicketForm.title) return toast.error("Title is required")
    setIsSubmitting(true)
    try {
      const res = await createTicket(agencyId, newTicketForm)
      if (res.success) {
        toast.success("Ticket created successfully")
        setTickets([res.ticket, ...tickets])
        setIsNewTicketOpen(false)
        setNewTicketForm({ title: "", description: "", priority: "normal" })
      } else {
        toast.error("Failed to create ticket")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
    setIsSubmitting(false)
  }

  const handleStatusChange = async (id: string, status: string) => {
    const res = await updateTicketStatus(id, status)
    if (res.success) {
      toast.success(`Ticket marked as ${status}`)
      setTickets(tickets.map(t => t.id === id ? { ...t, status } : t))
    }
  }

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                          (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
    const matchesStatus = filterStatus === "all" || t.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open": return <Badge className="bg-warning/10 text-warning hover:bg-warning/20 border-warning/20"><AlertCircle className="w-3 h-3 mr-1" /> Open</Badge>
      case "pending": return <Badge variant="outline" className="text-text-secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>
      case "resolved": return <Badge className="bg-success/10 text-success hover:bg-success/20 border-success/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Resolved</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case "urgent": return "text-destructive"
      case "high": return "text-warning"
      default: return "text-text-secondary"
    }
  }

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Help Desk</h1>
          <p className="text-text-secondary">Manage customer support inquiries and tickets.</p>
        </div>
        
        <Dialog open={isNewTicketOpen} onOpenChange={setIsNewTicketOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New Ticket</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <Input 
                  placeholder="e.g. Cannot access dashboard" 
                  value={newTicketForm.title}
                  onChange={e => setNewTicketForm({...newTicketForm, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select 
                  className="w-full flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newTicketForm.priority}
                  onChange={e => setNewTicketForm({...newTicketForm, priority: e.target.value})}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  className="w-full min-h-[100px] flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Describe the issue..."
                  value={newTicketForm.description}
                  onChange={e => setNewTicketForm({...newTicketForm, description: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setIsNewTicketOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateTicket} disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Ticket"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-bg-secondary border border-border rounded-xl flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between bg-bg-primary">
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <Input 
                placeholder="Search tickets..." 
                className="pl-9 bg-bg-secondary border-none"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={filterStatus === "all" ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setFilterStatus("all")}
            >
              All
            </Button>
            <Button 
              variant={filterStatus === "open" ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setFilterStatus("open")}
            >
              Open
            </Button>
            <Button 
              variant={filterStatus === "resolved" ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setFilterStatus("resolved")}
            >
              Resolved
            </Button>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4 text-text-secondary" />
            </Button>
          </div>
        </div>

        {/* List View */}
        <div className="flex-1 overflow-auto">
          {filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Inbox className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No tickets found</h3>
              <p className="text-text-secondary max-w-md">
                {search ? "No tickets match your search criteria." : "You're all caught up! There are no active support tickets."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredTickets.map(ticket => (
                <div key={ticket.id} className="p-4 bg-bg-primary hover:bg-bg-secondary/50 transition-colors flex items-start gap-4 group">
                  <div className="mt-1">
                    <MessageSquare className="w-5 h-5 text-text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <h4 className="font-medium text-text-primary truncate">{ticket.title}</h4>
                      <div className="flex items-center gap-2 shrink-0">
                        {getStatusBadge(ticket.status)}
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary line-clamp-1 mb-2">
                      {ticket.description || "No description provided."}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-text-secondary">
                      <span>ID: #{ticket.id.substring(ticket.id.length - 6).toUpperCase()}</span>
                      <span className="flex items-center gap-1">
                        Priority: <span className={`capitalize font-medium ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</span>
                      </span>
                      <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 shrink-0">
                    {ticket.status !== "resolved" && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(ticket.id, "resolved")}>
                        Resolve
                      </Button>
                    )}
                    {ticket.status === "resolved" && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(ticket.id, "open")}>
                        Reopen
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
