"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { LifeBuoy, CheckCircle2, Loader2, MessageSquare, AlertCircle } from "lucide-react"
import { updatePlatformTicketStatus } from "@/app/actions/platform-admin"

import { parseTicketDescription } from "@/lib/support-utils"

interface TicketItem {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  createdAt: Date
  agency: { id: string; name: string; subdomain: string | null; planTier: string }
  contact: { id: string; firstName: string; lastName: string | null; email: string | null } | null
}

export function SupportQueueClient({
  initialTickets
}: {
  initialTickets: TicketItem[]
}) {
  const [tickets, setTickets] = useState<TicketItem[]>(initialTickets)
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null)
  const [newStatus, setNewStatus] = useState("resolved")
  const [replyMessage, setReplyMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleResolve = async () => {
    if (!selectedTicket) return

    setIsLoading(true)
    try {
      const res = await updatePlatformTicketStatus(selectedTicket.id, newStatus)
      if (res.success) {
        setTickets(tickets.map(t => t.id === selectedTicket.id ? { ...t, status: newStatus } : t))
        setSuccessMessage(`Ticket #${selectedTicket.id.slice(-5)} marked as ${newStatus}!`)
        setSelectedTicket(null)
        setReplyMessage("")
        setTimeout(() => setSuccessMessage(null), 4000)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {successMessage && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5" /> {successMessage}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Cross-Tenant Support Queue</h1>
        <p className="text-sm text-text-secondary">Triage, manage, and resolve tickets submitted by agency owners.</p>
      </div>

      <Card className="border border-border bg-bg-primary shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Incoming Agency Tickets ({tickets.length})</CardTitle>
          <CardDescription className="text-xs">Prioritized by SLA response time and plan tier.</CardDescription>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="p-8 text-center text-text-secondary text-sm">
              <LifeBuoy className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
              All caught up! No unresolved support tickets.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {tickets.map((t) => {
                const parsed = parseTicketDescription(t.description)

                return (
                  <div key={t.id} className="py-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-text-primary">{t.title}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          t.priority === "urgent" ? "bg-red-500/10 text-red-600 dark:text-red-400" :
                          t.priority === "high" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                          "bg-bg-secondary text-text-secondary"
                        }`}>
                          {t.priority}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          t.status === "open" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                          t.status === "resolved" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                          "bg-bg-secondary text-text-secondary"
                        }`}>
                          {t.status}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-1 line-clamp-2">{parsed.text || "No details provided."}</p>
                      <p className="text-[11px] text-text-secondary mt-2 flex items-center gap-2">
                        <span className="font-semibold text-primary">{t.agency.name}</span>
                        <span>·</span>
                        <span>Submitted by {t.contact?.firstName || "Agency Owner"}</span>
                        <span>·</span>
                        <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button 
                        onClick={() => {
                          setSelectedTicket(t)
                          setNewStatus(t.status === "open" ? "resolved" : "open")
                        }} 
                        variant="outline" 
                        size="sm"
                      >
                        {t.status === "open" ? "Reply & Resolve" : "Re-open Ticket"}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Resolve Ticket: {selectedTicket?.title}</DialogTitle>
            <DialogDescription>
              From {selectedTicket?.agency.name} ({selectedTicket?.contact?.email || "Agency Owner"})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg border border-border bg-bg-secondary/40 text-xs text-text-secondary">
              <p className="font-semibold text-text-primary mb-1">Customer Issue:</p>
              <p>{selectedTicket ? parseTicketDescription(selectedTicket.description).text : "No description provided."}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1">Status Update</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="resolved">Resolved (Close ticket)</option>
                <option value="pending">Pending (Waiting for customer response)</option>
                <option value="open">Open (In Progress)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1">Admin Response Note</label>
              <textarea 
                className="w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                placeholder="Type resolution reply or internal notes..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button variant="outline" onClick={() => setSelectedTicket(null)}>
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={isLoading} className="flex items-center gap-2">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
