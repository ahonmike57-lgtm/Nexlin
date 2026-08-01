"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, FileText, CheckCircle, Clock, Send, ShieldAlert, DollarSign } from "lucide-react"
import { createCPQQuote, approveCPQQuote } from "@/app/actions/cpq"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"

export default function InvoicesClient({ initialQuotes }: { initialQuotes: any[] }) {
  const [quotes, setQuotes] = useState<any[]>(initialQuotes)
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState(1500)
  const [discount, setDiscount] = useState(0)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsCreating(true)
    const res = await createCPQQuote({
      title,
      contactId: "contact-sample",
      discountPercentage: Number(discount),
      items: [{ name: title, quantity: 1, unitPrice: Number(amount) }]
    })
    setIsCreating(false)

    if (res.success && res.data) {
      toast.success(res.data.requiresApproval ? "Proposal created (Pending Manager Approval)" : "Invoice proposal created!")
      setQuotes(prev => [
        {
          id: res.data.quote.id,
          title,
          total: Number(amount) - (Number(amount) * Number(discount)) / 100,
          status: res.data.requiresApproval ? "pending_approval" : "approved",
          createdAt: new Date().toISOString()
        },
        ...prev
      ])
      setIsOpen(false)
      setTitle("")
    } else {
      toast.error('error' in res ? res.error : "Failed to create quote")
    }
  }

  const handleApprove = async (quoteId: string) => {
    const res = await approveCPQQuote(quoteId)
    if (res.success) {
      toast.success("Proposal approved!")
      setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, status: "approved" } : q))
    } else {
      toast.error('error' in res ? res.error : "Approval failed")
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proposals & CPQ Invoices</h1>
          <p className="text-sm text-text-secondary">Generate quotes, configure pricing, and collect signatures.</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Create Proposal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">Total Proposals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quotes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">Pending Manager Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              {quotes.filter(q => q.status === "pending_approval").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">Approved Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              ${quotes.filter(q => q.status === "approved").reduce((sum, q) => sum + (q.total || 0), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Quotes & Invoices</CardTitle>
          <CardDescription>View, approve, and send deals CPQ quotes.</CardDescription>
        </CardHeader>
        <CardContent>
          {quotes.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No proposals created yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {quotes.map(q => (
                <div key={q.id} className="py-3.5 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold">{q.title || "CPQ Quote"}</p>
                      <p className="text-xs text-text-secondary font-mono">{new Date(q.createdAt || Date.now()).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-bold font-mono">${(q.total || 0).toLocaleString()}</span>
                    {q.status === "pending_approval" ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> &gt;20% Discount (Pending)
                        </span>
                        <Button size="sm" variant="outline" onClick={() => handleApprove(q.id)} className="h-7 text-xs">
                          Approve
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-success/10 text-success font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Approved
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Proposal & Quote</DialogTitle>
            <DialogDescription>Create a custom invoice quote for a contact.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateQuote} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-medium block mb-1">Proposal Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="2021 Silverado Premium Package"
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg-secondary outline-none text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Unit Price ($)</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg-secondary outline-none text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Discount % (Discounts &gt;20% require manager approval)</label>
              <input
                type="number"
                value={discount}
                onChange={e => setDiscount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg-secondary outline-none text-sm font-mono"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isCreating || !title.trim()}>
                {isCreating ? "Creating..." : "Generate Proposal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
