"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Search,
  Plus,
  Filter,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  Inbox,
  BookOpen,
  Sparkles,
  Send,
  Lock,
  User,
  ExternalLink,
  Shield,
  ChevronRight,
  Loader2,
  Trash2,
  Check
} from "lucide-react"
import {
  createTicket,
  updateTicket,
  addTicketReply,
  generateAiTicketResolution,
} from "@/app/actions/support"
import { parseTicketDescription, type TicketThreadMessage } from "@/lib/support-utils"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { format } from "date-fns"

interface ContactItem {
  id: string
  firstName: string
  lastName: string | null
  email: string | null
  phone: string | null
}

interface StaffItem {
  id: string
  name: string | null
  email: string | null
  role: string
}

interface SupportClientProps {
  initialTickets: any[]
  agencyId: string
  contacts: ContactItem[]
  staffMembers: StaffItem[]
}

export default function SupportClient({
  initialTickets,
  agencyId,
  contacts,
  staffMembers
}: SupportClientProps) {
  const [tickets, setTickets] = useState<any[]>(initialTickets)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(initialTickets[0]?.id || null)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all") // all, open, pending, resolved
  const [filterPriority, setFilterPriority] = useState("all")

  // Reply Composer State
  const [replyContent, setReplyContent] = useState("")
  const [isInternalNote, setIsInternalNote] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  const [aiDraft, setAiDraft] = useState<string | null>(null)

  // New Ticket Dialog State
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false)
  const [newTicketForm, setNewTicketForm] = useState({
    title: "",
    description: "",
    priority: "normal",
    contactId: "",
    assignedTo: ""
  })
  const [isSubmittingNew, setIsSubmittingNew] = useState(false)

  const selectedTicket = tickets.find(t => t.id === selectedTicketId)
  const parsedData = selectedTicket ? parseTicketDescription(selectedTicket.description) : { text: "", thread: [] }

  // Canned Responses
  const cannedTemplates = [
    {
      title: "Investigating Issue",
      content: "Hi there,\n\nThank you for reaching out. We have received your ticket and our engineering team is actively investigating this behavior. We will update you shortly as soon as we have findings.\n\nBest regards,\nSupport Operations"
    },
    {
      title: "Request Screenshot / URL",
      content: "Hello,\n\nCould you please provide a screen recording or screenshot of the error, along with the exact URL or browser version you are using? This will help us reproduce and resolve the issue quickly.\n\nThank you!"
    },
    {
      title: "Issue Resolved",
      content: "Hi there,\n\nWe have deployed a patch to address the issue you reported, and all systems are operating normally. Please refresh your dashboard and test again.\n\nFeel free to reopen this ticket if you need any further assistance!"
    },
    {
      title: "Billing Verification",
      content: "Hello,\n\nWe have reviewed your billing inquiry and our accounts team has updated your invoice accordingly. You can view the updated receipt in Settings > Billing.\n\nBest regards,\nBilling Support"
    }
  ]

  const handleCreateTicket = async () => {
    if (!newTicketForm.title.trim()) return toast.error("Please enter a subject title.")
    if (!newTicketForm.description.trim()) return toast.error("Please enter an issue description.")

    setIsSubmittingNew(true)
    try {
      const res = await createTicket(agencyId, newTicketForm)
      if (res.success && res.ticket) {
        toast.success("Ticket created successfully!")
        setTickets([res.ticket, ...tickets])
        setSelectedTicketId(res.ticket.id)
        setIsNewTicketOpen(false)
        setNewTicketForm({
          title: "",
          description: "",
          priority: "normal",
          contactId: "",
          assignedTo: ""
        })
      } else {
        toast.error(res.error || "Failed to create ticket")
      }
    } catch (error) {
      toast.error("An error occurred creating ticket")
    } finally {
      setIsSubmittingNew(false)
    }
  }

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTicket) return
    const res = await updateTicket(selectedTicket.id, { status })
    if (res.success && res.ticket) {
      setTickets(tickets.map(t => t.id === selectedTicket.id ? res.ticket : t))
      toast.success(`Ticket marked as ${status}`)
    }
  }

  const handleUpdatePriority = async (priority: string) => {
    if (!selectedTicket) return
    const res = await updateTicket(selectedTicket.id, { priority })
    if (res.success && res.ticket) {
      setTickets(tickets.map(t => t.id === selectedTicket.id ? res.ticket : t))
      toast.success(`Priority updated to ${priority}`)
    }
  }

  const handleUpdateAssignee = async (assignedTo: string) => {
    if (!selectedTicket) return
    const res = await updateTicket(selectedTicket.id, { assignedTo: assignedTo || "" })
    if (res.success && res.ticket) {
      setTickets(tickets.map(t => t.id === selectedTicket.id ? res.ticket : t))
      toast.success("Assignee updated")
    }
  }

  const handleSendReply = async (andResolve: boolean = false) => {
    if (!selectedTicket || !replyContent.trim()) return toast.error("Please enter a message")

    setIsSending(true)
    try {
      const res = await addTicketReply(selectedTicket.id, replyContent, isInternalNote)
      if (res.success && res.ticket) {
        let finalTicket = res.ticket
        if (andResolve) {
          const resolveRes = await updateTicket(selectedTicket.id, { status: "resolved" })
          if (resolveRes.success && resolveRes.ticket) finalTicket = resolveRes.ticket
        }
        setTickets(tickets.map(t => t.id === selectedTicket.id ? finalTicket : t))
        setReplyContent("")
        setAiDraft(null)
        toast.success(isInternalNote ? "Internal note added" : "Reply sent to customer")
      } else {
        toast.error(res.error || "Failed to send message")
      }
    } catch (err) {
      toast.error("Error sending message")
    } finally {
      setIsSending(false)
    }
  }

  const handleGenerateAiResponse = async () => {
    if (!selectedTicket) return
    setIsGeneratingAi(true)
    try {
      const res = await generateAiTicketResolution(selectedTicket.title, parsedData.text, agencyId)
      if (res.success && res.suggestedReply) {
        setAiDraft(res.suggestedReply)
        toast.success("AI Copilot drafted a resolution!")
      } else {
        toast.error(res.error || "Could not generate AI reply")
      }
    } catch (err) {
      toast.error("Error drafting AI reply")
    } finally {
      setIsGeneratingAi(false)
    }
  }

  const filteredTickets = tickets.filter(t => {
    const parsed = parseTicketDescription(t.description)
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      parsed.text.toLowerCase().includes(search.toLowerCase()) ||
      (t.contact?.firstName && t.contact.firstName.toLowerCase().includes(search.toLowerCase())) ||
      (t.contact?.email && t.contact.email.toLowerCase().includes(search.toLowerCase()))

    const matchesStatus = filterStatus === "all" || t.status === filterStatus
    const matchesPriority = filterPriority === "all" || t.priority === filterPriority

    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold text-[10px] uppercase">Open</Badge>
      case "pending":
        return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-bold text-[10px] uppercase">Pending</Badge>
      case "resolved":
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold text-[10px] uppercase">Resolved</Badge>
      case "closed":
        return <Badge variant="outline" className="text-text-secondary text-[10px] uppercase">Closed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <span className="text-red-500 font-bold text-xs uppercase flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Urgent</span>
      case "high":
        return <span className="text-amber-500 font-semibold text-xs uppercase">High</span>
      case "low":
        return <span className="text-slate-400 font-medium text-xs uppercase">Low</span>
      default:
        return <span className="text-text-secondary font-medium text-xs uppercase">Normal</span>
    }
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Help Desk & Support</h1>
          <p className="text-text-secondary text-sm">
            Triage client tickets, collaborate on internal staff notes, and draft AI-assisted resolutions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/support/knowledge-base">
            <Button variant="outline" size="sm">
              <BookOpen className="w-4 h-4 mr-2 text-primary" /> Knowledge Base
            </Button>
          </Link>

          {/* New Ticket Modal */}
          <Dialog open={isNewTicketOpen} onOpenChange={setIsNewTicketOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary text-white">
                <Plus className="w-4 h-4 mr-1.5" /> New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[580px]">
              <DialogHeader>
                <DialogTitle>Create Customer Support Ticket</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Subject / Issue Title *</label>
                  <Input
                    placeholder="e.g. Inbound Twilio numbers not receiving SMS"
                    value={newTicketForm.title}
                    onChange={e => setNewTicketForm({ ...newTicketForm, title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Associated Contact</label>
                    <select
                      className="w-full h-9 rounded-md border border-border bg-bg-primary px-3 text-xs text-text-primary"
                      value={newTicketForm.contactId}
                      onChange={e => setNewTicketForm({ ...newTicketForm, contactId: e.target.value })}
                    >
                      <option value="">-- Select CRM Contact (Optional) --</option>
                      {contacts.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.firstName} {c.lastName || ""} ({c.email || c.phone || "No contact info"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Priority</label>
                    <select
                      className="w-full h-9 rounded-md border border-border bg-bg-primary px-3 text-xs text-text-primary"
                      value={newTicketForm.priority}
                      onChange={e => setNewTicketForm({ ...newTicketForm, priority: e.target.value })}
                    >
                      <option value="low">Low (General Inquiry)</option>
                      <option value="normal">Normal (Standard Request)</option>
                      <option value="high">High (Feature Impacted)</option>
                      <option value="urgent">Urgent (System Blocker / Outage)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Assign To Rep</label>
                  <select
                    className="w-full h-9 rounded-md border border-border bg-bg-primary px-3 text-xs text-text-primary"
                    value={newTicketForm.assignedTo}
                    onChange={e => setNewTicketForm({ ...newTicketForm, assignedTo: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {staffMembers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name || s.email} ({s.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Issue Details *</label>
                  <textarea
                    className="w-full min-h-[120px] rounded-md border border-border bg-bg-primary p-3 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Provide full context, error codes, steps to reproduce..."
                    value={newTicketForm.description}
                    onChange={e => setNewTicketForm({ ...newTicketForm, description: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <Button variant="ghost" size="sm" onClick={() => setIsNewTicketOpen(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleCreateTicket} disabled={isSubmittingNew} className="bg-primary text-white">
                    {isSubmittingNew ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                    Create Ticket
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main 2-Panel Support Desk */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        {/* Left Column: Ticket List (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-border bg-bg-primary flex flex-col overflow-hidden shadow-sm">
          {/* Filter Bar */}
          <div className="p-3 border-b border-border space-y-2 bg-bg-secondary/40">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <Input
                placeholder="Search by subject, email, contact..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-bg-primary"
              />
            </div>

            <div className="flex items-center justify-between gap-1 overflow-x-auto text-xs">
              <div className="flex items-center gap-1">
                {["all", "open", "pending", "resolved"].map(st => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                      filterStatus === st
                        ? "bg-primary text-white"
                        : "bg-bg-primary text-text-secondary hover:bg-bg-secondary"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <select
                className="h-7 rounded-md border border-border bg-bg-primary px-2 text-[11px] text-text-secondary"
                value={filterPriority}
                onChange={e => setFilterPriority(e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Ticket Cards List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Inbox className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-bold text-sm text-text-primary">No Tickets Found</h4>
                <p className="text-xs text-text-secondary mt-1 max-w-[200px]">
                  {search ? "No tickets match your filter criteria." : "All customer inquiries are resolved!"}
                </p>
              </div>
            ) : (
              filteredTickets.map(ticket => {
                const parsed = parseTicketDescription(ticket.description)
                const isSelected = ticket.id === selectedTicketId

                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`p-3.5 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-primary/5 border-l-4 border-l-primary"
                        : "hover:bg-bg-secondary/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-[10px] text-text-secondary">
                        #{ticket.id.slice(-6).toUpperCase()}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {getPriorityBadge(ticket.priority)}
                        {getStatusBadge(ticket.status)}
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-text-primary truncate mb-1">
                      {ticket.title}
                    </h4>

                    <p className="text-[11px] text-text-secondary line-clamp-1 mb-2">
                      {parsed.text || "No issue details provided."}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-text-secondary">
                      <span className="flex items-center gap-1 truncate max-w-[140px]">
                        <User className="w-3 h-3 text-text-secondary shrink-0" />
                        {ticket.contact?.firstName ? `${ticket.contact.firstName} ${ticket.contact.lastName || ""}` : "Direct Submission"}
                      </span>
                      <span>{format(new Date(ticket.createdAt), "MMM d, h:mm a")}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: Ticket Conversation & Resolution Studio (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-border bg-bg-primary flex flex-col overflow-hidden shadow-sm">
          {selectedTicket ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Ticket Top Header & Actions */}
              <div className="p-4 border-b border-border bg-bg-secondary/30 space-y-3 flex-shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-text-secondary">
                        Ticket #{selectedTicket.id.slice(-6).toUpperCase()}
                      </span>
                      {getStatusBadge(selectedTicket.status)}
                    </div>
                    <h2 className="text-lg font-bold text-text-primary">
                      {selectedTicket.title}
                    </h2>
                  </div>

                  {/* Status, Priority & Assignee Controls */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      className="h-8 rounded-lg border border-border bg-bg-primary px-2 text-xs font-semibold text-text-primary"
                      value={selectedTicket.status}
                      onChange={e => handleUpdateStatus(e.target.value)}
                    >
                      <option value="open">Open</option>
                      <option value="pending">Pending</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>

                    <select
                      className="h-8 rounded-lg border border-border bg-bg-primary px-2 text-xs font-semibold text-text-primary"
                      value={selectedTicket.priority}
                      onChange={e => handleUpdatePriority(e.target.value)}
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>

                    <select
                      className="h-8 rounded-lg border border-border bg-bg-primary px-2 text-xs font-semibold text-text-primary"
                      value={selectedTicket.assignedTo || ""}
                      onChange={e => handleUpdateAssignee(e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {staffMembers.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name || s.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Associated Contact Information Bar */}
                {selectedTicket.contact && (
                  <div className="p-2.5 rounded-xl bg-bg-primary border border-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {selectedTicket.contact.firstName.substring(0, 1)}
                      </div>
                      <div>
                        <span className="font-bold text-text-primary">
                          {selectedTicket.contact.firstName} {selectedTicket.contact.lastName || ""}
                        </span>
                        <span className="text-text-secondary ml-2">
                          {selectedTicket.contact.email || selectedTicket.contact.phone || "No email"}
                        </span>
                      </div>
                    </div>
                    <Link
                      href="/crm/contacts"
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold"
                    >
                      Open in CRM <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Message Thread History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg-secondary/10">
                {parsedData.thread.length === 0 ? (
                  <div className="p-4 rounded-xl border border-border bg-bg-primary space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-text-secondary">
                      <span className="font-semibold text-text-primary">Initial Ticket Issue</span>
                      <span>{format(new Date(selectedTicket.createdAt), "MMM d, h:mm a")}</span>
                    </div>
                    <p className="text-xs text-text-primary whitespace-pre-wrap leading-relaxed">
                      {parsedData.text}
                    </p>
                  </div>
                ) : (
                  parsedData.thread.map((msg, idx) => (
                    <div
                      key={msg.id || idx}
                      className={`p-4 rounded-xl border transition-all ${
                        msg.isInternal
                          ? "bg-amber-500/5 border-amber-500/20 text-amber-900 dark:text-amber-200"
                          : msg.role === "agent"
                          ? "bg-primary/5 border-primary/20 text-text-primary ml-4"
                          : "bg-bg-primary border-border text-text-primary mr-4"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">
                            {msg.senderName}
                          </span>
                          {msg.isInternal ? (
                            <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                              <Lock className="w-2.5 h-2.5 mr-1" /> Internal Staff Note
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] font-semibold">
                              {msg.role === "agent" ? "Support Rep" : "Client"}
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-text-secondary">
                          {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                        </span>
                      </div>

                      <p className="text-xs whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* AI Draft Suggestion Box (If generated) */}
              {aiDraft && (
                <div className="p-3 mx-4 my-2 rounded-xl bg-violet-500/10 border border-violet-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-violet-600" /> AI Knowledge Copilot Draft
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs text-violet-600 hover:bg-violet-500/20"
                      onClick={() => {
                        setReplyContent(aiDraft)
                        setAiDraft(null)
                      }}
                    >
                      <Check className="w-3 h-3 mr-1" /> Insert into Reply
                    </Button>
                  </div>
                  <p className="text-xs text-violet-900 dark:text-violet-200 line-clamp-3 whitespace-pre-wrap">
                    {aiDraft}
                  </p>
                </div>
              )}

              {/* Reply Composer Bar */}
              <div className="p-4 border-t border-border bg-bg-primary space-y-3 flex-shrink-0">
                {/* Mode Selector & Quick Tools */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsInternalNote(false)}
                      className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                        !isInternalNote ? "bg-primary text-white" : "text-text-secondary hover:bg-bg-secondary"
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Public Reply
                    </button>
                    <button
                      onClick={() => setIsInternalNote(true)}
                      className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                        isInternalNote ? "bg-amber-500 text-white" : "text-text-secondary hover:bg-bg-secondary"
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" /> 🔒 Internal Note
                    </button>
                  </div>

                  {/* AI & Canned Responses Dropdown */}
                  <div className="flex items-center gap-2">
                    <select
                      className="h-7 rounded-md border border-border bg-bg-secondary px-2 text-[11px] text-text-secondary"
                      onChange={e => {
                        const template = cannedTemplates.find(c => c.title === e.target.value)
                        if (template) setReplyContent(template.content)
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>⚡ Canned Responses...</option>
                      {cannedTemplates.map(c => (
                        <option key={c.title} value={c.title}>{c.title}</option>
                      ))}
                    </select>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] text-violet-600 border-violet-500/30 hover:bg-violet-500/10"
                      onClick={handleGenerateAiResponse}
                      disabled={isGeneratingAi}
                    >
                      {isGeneratingAi ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : (
                        <Sparkles className="w-3 h-3 mr-1 text-violet-600" />
                      )}
                      Draft with AI
                    </Button>
                  </div>
                </div>

                <textarea
                  className={`w-full min-h-[90px] rounded-xl border p-3 text-xs text-text-primary focus:outline-none focus:ring-1 ${
                    isInternalNote
                      ? "bg-amber-500/5 border-amber-500/30 focus:ring-amber-500"
                      : "bg-bg-primary border-border focus:ring-primary"
                  }`}
                  placeholder={
                    isInternalNote
                      ? "Write a private note visible only to your agency staff..."
                      : "Type your reply to the customer..."
                  }
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                />

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-secondary">
                    {isInternalNote ? "⚠️ Internal notes are NEVER visible to the client." : "✉️ Reply will be logged to client history."}
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSendReply(true)}
                      disabled={isSending || !replyContent.trim()}
                      className="text-emerald-600 hover:bg-emerald-500/10"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Send & Resolve
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleSendReply(false)}
                      disabled={isSending || !replyContent.trim()}
                      className="bg-primary text-white"
                    >
                      {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Send className="w-3.5 h-3.5 mr-1" />}
                      Send Message
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-text-secondary">
              <MessageSquare className="w-12 h-12 text-border mb-3" />
              <h3 className="font-bold text-sm text-text-primary">No Ticket Selected</h3>
              <p className="text-xs mt-1">Select a ticket from the left panel to inspect the conversation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
