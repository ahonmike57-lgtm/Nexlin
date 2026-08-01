"use client"

import { useState, useEffect } from "react"
import { getCPQQuotes, createCPQQuote, approveCPQQuote } from "@/app/actions/cpq"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, CheckCircle, Clock, ShieldCheck, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function CPQQuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState("")
  const [contactId] = useState("contact-1")
  const [discount, setDiscount] = useState(0)
  const [items] = useState([
    { name: "SaaS Pro Plan (Annual)", quantity: 1, unitPrice: 2970 },
    { name: "Onboarding & Custom Setup", quantity: 1, unitPrice: 500 }
  ])

  const loadQuotes = async () => {
    setLoading(true)
    const res = await getCPQQuotes()
    if (res.success && 'data' in res && res.data) {
      setQuotes(res.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadQuotes()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) return

    setSaving(true)
    const res = await createCPQQuote({
      title,
      contactId,
      discountPercentage: Number(discount),
      items
    })

    if (res.success && 'data' in res && res.data) {
      toast.success(res.data.requiresApproval ? "Quote created & flagged for manager discount approval" : "Quote created & approved!")
      setOpen(false)
      setTitle("")
      setDiscount(0)
      loadQuotes()
    } else {
      toast.error('error' in res ? res.error : "Failed to create quote")
    }
    setSaving(false)
  }

  const handleApprove = async (id: string) => {
    const res = await approveCPQQuote(id)
    if (res.success) {
      toast.success("Quote approved!")
      loadQuotes()
    } else {
      toast.error('error' in res ? res.error : "Approval failed")
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CPQ Quote Builder</h1>
          <p className="text-text-secondary mt-1">Configure, Price, Quote B2B deals with dynamic discount approvals and product bundles.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create CPQ Quote
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-bg-primary border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> New B2B Deal Quote
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">Quote Title</label>
                <Input
                  placeholder="e.g. Acme Corp 100-Seat Enterprise License"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Discount Percentage (%)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
                <p className="text-[11px] text-text-secondary">Discounts over 20% require Manager Approval before client signature.</p>
              </div>

              <div className="space-y-2 border-t border-border pt-3">
                <div className="text-xs font-semibold text-text-secondary uppercase">Configured Product Line Items</div>
                {items.map((item, i) => (
                  <div key={i} className="flex gap-2 items-center text-xs">
                    <Input className="flex-1" value={item.name} readOnly />
                    <span className="w-12 font-mono">x{item.quantity}</span>
                    <span className="w-20 font-mono text-right">${item.unitPrice}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Generate Quote
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : quotes.length === 0 ? (
        <div className="text-center py-12 bg-bg-primary rounded-xl border border-border space-y-3">
          <FileText className="w-10 h-10 text-text-secondary mx-auto" />
          <h3 className="font-semibold text-lg">No CPQ Quotes Generated Yet</h3>
          <p className="text-sm text-text-secondary">Click "Create CPQ Quote" to build your first dynamic B2B pricing quote.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((q) => (
            <div key={q.id} className="p-5 rounded-xl border border-border bg-bg-primary flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-base text-text-primary">{q.title}</h3>
                  <Badge variant={q.status === 'approved' ? 'default' : 'secondary'} className="capitalize text-[10px]">
                    {q.status === 'approved' ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                    {q.status?.replace("_", " ")}
                  </Badge>
                </div>
                <div className="text-xs text-text-secondary space-x-3 font-mono">
                  <span>Subtotal: ${q.subtotal}</span>
                  <span>Discount: {q.discountPercentage}%</span>
                  <span className="font-bold text-text-primary">Total: ${q.total}</span>
                </div>
              </div>

              {q.status === "pending_approval" && (
                <Button size="sm" onClick={() => handleApprove(q.id)}>
                  <ShieldCheck className="w-4 h-4 mr-1" /> Approve Discount
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
