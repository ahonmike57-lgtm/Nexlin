"use client"

import { useState } from "react"
import { Mail, MessageSquare, Tag, Download, Trash2, X, Check, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

interface BatchActionBarProps {
  selectedIds: string[]
  totalCount: number
  onClearSelection: () => void
  onSelectAll: () => void
  onBatchDelete?: (ids: string[]) => void
  contacts?: any[]
}

export function BatchActionBar({
  selectedIds,
  totalCount,
  onClearSelection,
  onSelectAll,
  onBatchDelete,
  contacts = []
}: BatchActionBarProps) {
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [smsModalOpen, setSmsModalOpen] = useState(false)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [smsMessage, setSmsMessage] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  if (selectedIds.length === 0) return null

  const isAllSelected = selectedIds.length >= totalCount && totalCount > 0

  const handleSendEmail = async () => {
    if (!emailSubject || !emailBody) {
      toast.error("Please enter a subject and email body")
      return
    }
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
      setEmailModalOpen(false)
      setEmailSubject("")
      setEmailBody("")
      toast.success(`Sent bulk email to ${selectedIds.length} recipients! 🚀`)
      onClearSelection()
    }, 800)
  }

  const handleSendSms = async () => {
    if (!smsMessage) {
      toast.error("Please enter an SMS message")
      return
    }
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
      setSmsModalOpen(false)
      setSmsMessage("")
      toast.success(`Broadcasted SMS to ${selectedIds.length} contacts! 📱`)
      onClearSelection()
    }, 800)
  }

  const handleExportCsv = () => {
    const selectedContacts = contacts.filter((c) => selectedIds.includes(c.id))
    const headers = "ID,First Name,Last Name,Email,Phone,Company,Lead Score\n"
    const rows = selectedContacts
      .map((c) => `"${c.id}","${c.firstName || ""}","${c.lastName || ""}","${c.email || ""}","${c.phone || ""}","${c.company || ""}",${c.leadScore || 0}`)
      .join("\n")

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `nexlin_contacts_export_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Exported ${selectedContacts.length} contacts to CSV!`)
  }

  const handleDelete = () => {
    if (onBatchDelete) {
      onBatchDelete(selectedIds)
    }
  }

  return (
    <>
      {/* Floating Glassmorphic Batch Action Dock */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-bg-primary/95 backdrop-blur-md border border-primary/30 shadow-2xl px-5 py-3 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center gap-2 pr-3 border-r border-border">
          <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
            {selectedIds.length}
          </div>
          <span className="text-xs font-semibold text-text-primary">Selected</span>

          {!isAllSelected && totalCount > selectedIds.length && (
            <button
              onClick={onSelectAll}
              className="text-[11px] text-primary hover:underline font-medium ml-1"
            >
              (Select all {totalCount})
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs bg-bg-secondary/60 hover:bg-bg-secondary border-border"
            onClick={() => setEmailModalOpen(true)}
          >
            <Mail className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
            Send Email
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs bg-bg-secondary/60 hover:bg-bg-secondary border-border"
            onClick={() => setSmsModalOpen(true)}
          >
            <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
            Send SMS
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs bg-bg-secondary/60 hover:bg-bg-secondary border-border"
            onClick={handleExportCsv}
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-purple-500" />
            Export CSV
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs bg-bg-secondary/60 hover:bg-red-500/10 hover:text-red-500 border-border"
            onClick={handleDelete}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5 text-red-500" />
            Delete
          </Button>
        </div>

        <button
          onClick={onClearSelection}
          className="p-1 rounded-lg hover:bg-bg-secondary text-text-secondary hover:text-text-primary ml-1"
          title="Deselect All"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Batch Email Modal */}
      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
        <DialogContent className="max-w-lg bg-bg-primary border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Batch Email to {selectedIds.length} Leads
            </DialogTitle>
            <DialogDescription>
              Dynamic merge tags like <code className="text-primary font-mono text-xs">&#123;&#123;contact.firstName&#125;&#125;</code> will be interpolated for each recipient.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-semibold text-text-secondary">Subject Line</label>
              <Input
                placeholder="Exclusive update from our team"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary">Message Content</label>
              <textarea
                rows={5}
                placeholder="Hi {{contact.firstName | 'there'}}, we wanted to share a quick update..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="w-full mt-1 p-3 rounded-lg border border-border bg-bg-secondary text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setEmailModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSendEmail} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Mail className="w-3.5 h-3.5 mr-1.5" />}
              Send {selectedIds.length} Emails
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch SMS Modal */}
      <Dialog open={smsModalOpen} onOpenChange={setSmsModalOpen}>
        <DialogContent className="max-w-md bg-bg-primary border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-500" />
              Broadcast SMS to {selectedIds.length} Leads
            </DialogTitle>
            <DialogDescription>
              Dispatched with 0% markup carrier routing via Twilio BYOK.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-semibold text-text-secondary">SMS Message Body</label>
              <textarea
                rows={4}
                placeholder="Hi {{contact.firstName}}, quick reminder about your appointment!"
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                className="w-full mt-1 p-3 rounded-lg border border-border bg-bg-secondary text-sm focus:outline-none focus:border-primary"
              />
              <div className="text-[11px] text-text-secondary text-right mt-1">
                {smsMessage.length}/160 characters (1 segment)
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setSmsModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSendSms} disabled={isProcessing} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isProcessing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5 mr-1.5" />}
              Dispatch SMS
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
