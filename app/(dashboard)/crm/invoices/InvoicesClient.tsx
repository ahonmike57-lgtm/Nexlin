"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, FileText, CheckCircle, Clock, Send, ShieldAlert, DollarSign, PenTool, ShieldCheck } from "lucide-react"
import { createCPQQuote, approveCPQQuote, signCPQQuote } from "@/app/actions/cpq"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import SignaturePad from "@/components/SignaturePad"
import { toast } from "sonner"

export default function InvoicesClient({ initialQuotes }: { initialQuotes: any[] }) {
  const [quotes, setQuotes] = useState<any[]>(initialQuotes)
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState(1500)
  const [discount, setDiscount] = useState(0)
  const [isCreating, setIsCreating] = useState(false)

  // Signing Modal State
  const [signingQuote, setSigningQuote] = useState<any | null>(null)
  const [isSigning, setIsSigning] = useState(false)

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

  const handleSaveSignature = async (signatureDataUrl: string, signerName: string) => {
    if (!signingQuote) return
    setIsSigning(true)
    const res = await signCPQQuote({
      quoteId: signingQuote.id,
      signatureDataUrl,
      signerName,
    })
    setIsSigning(false)

    if (res.success && res.data) {
      toast.success(`Proposal signed legally! Certificate: ${res.data.certificateId}`)
      setQuotes(prev => prev.map(q => q.id === signingQuote.id ? {
        ...q,
        status: "signed",
        certificateId: res.data.certificateId,
        signedAt: res.data.signedAt,
        signerName
      } : q))
      setSigningQuote(null)
    } else {
      toast.error('error' in res ? res.error : "Failed to record signature")
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proposals & CPQ Invoices</h1>
          <p className="text-sm text-text-secondary">Generate quotes, configure pricing, and collect legally binding e-signatures.</p>
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
            <CardTitle className="text-sm font-medium text-text-secondary">Signed & Executed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {quotes.filter(q => q.status === "signed").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">Approved / Active Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${quotes.filter(q => q.status === "approved" || q.status === "signed").reduce((sum, q) => sum + (q.total || 0), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Quotes & Invoices</CardTitle>
          <CardDescription>View, approve, and collect digital signatures on CPQ quotes.</CardDescription>
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
                    <div className={`p-2 rounded-lg ${q.status === "signed" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}>
                      {q.status === "signed" ? <ShieldCheck className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-semibold">{q.title || "CPQ Quote"}</p>
                      <p className="text-xs text-text-secondary font-mono">
                        {new Date(q.createdAt || Date.now()).toLocaleDateString()}
                        {q.certificateId && ` · Cert: ${q.certificateId}`}
                      </p>
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
                    ) : q.status === "signed" ? (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-success/10 text-success font-semibold flex items-center gap-1 border border-success/20">
                        <ShieldCheck className="w-3.5 h-3.5" /> Signed & Certified
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Approved
                        </span>
                        <Button size="sm" onClick={() => setSigningQuote(q)} className="h-7 text-xs gap-1">
                          <PenTool className="w-3 h-3" /> Sign
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Proposal Dialog */}
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

      {/* Signature Modal */}
      {signingQuote && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <SignaturePad
            onSave={handleSaveSignature}
            onCancel={() => setSigningQuote(null)}
          />
        </div>
      )}
    </div>
  )
}

