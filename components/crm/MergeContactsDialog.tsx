"use client"

import { useState } from "react"
import { findDuplicateContacts, mergeContacts } from "@/app/actions/contacts-dedupe"
import { toast } from "sonner"
import { GitMerge, Loader2, RefreshCw, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function MergeContactsDialog({ onMerged }: { onMerged?: () => void }) {
  const [open, setOpen] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [merging, setMerging] = useState(false)
  const [duplicates, setDuplicates] = useState<any[]>([])
  const [scanned, setScanned] = useState(false)

  const handleScan = async () => {
    setScanning(true)
    const res = await findDuplicateContacts()
    if (res.success && 'data' in res && res.data) {
      setDuplicates(res.data)
      setScanned(true)
    } else {
      toast.error('error' in res ? res.error : "Failed to scan for duplicates")
    }
    setScanning(false)
  }

  const handleMergeGroup = async (targetId: string, sourceIds: string[]) => {
    setMerging(true)
    const res = await mergeContacts(targetId, sourceIds)
    if (res.success) {
      toast.success("Contacts merged successfully")
      setDuplicates(prev => prev.filter(g => !g.contacts.some((c: any) => c.id === targetId)))
      if (onMerged) onMerged()
    } else {
      toast.error('error' in res ? res.error : "Merge failed")
    }
    setMerging(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={() => { if (!scanned) handleScan() }}>
          <GitMerge className="w-4 h-4 mr-2" /> Deduplicate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-bg-primary text-text-primary border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitMerge className="w-5 h-5 text-primary" /> Contact Deduplication
            </div>
            <Button variant="ghost" size="sm" onClick={handleScan} disabled={scanning}>
              <RefreshCw className={`w-4 h-4 mr-1 ${scanning ? 'animate-spin' : ''}`} /> Rescan
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {scanning && (
            <div className="flex flex-col items-center justify-center py-8 text-text-secondary">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
              <p className="text-sm">Scanning database for duplicate emails and phone numbers...</p>
            </div>
          )}

          {!scanning && scanned && duplicates.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-text-secondary">
              <CheckCircle className="w-10 h-10 text-success mb-2" />
              <p className="font-semibold text-text-primary">No Duplicate Contacts Found</p>
              <p className="text-xs">Your database contact list is clean and unique.</p>
            </div>
          )}

          {!scanning && duplicates.map((group, idx) => {
            const primary = group.contacts[0]
            const sources = group.contacts.slice(1).map((c: any) => c.id)

            return (
              <div key={idx} className="p-4 rounded-lg border border-border bg-bg-secondary/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase">
                    Duplicate {group.field}: {group.value}
                  </span>
                  <Button 
                    size="sm" 
                    disabled={merging}
                    onClick={() => handleMergeGroup(primary.id, sources)}
                  >
                    {merging ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                    Merge into Primary
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {group.contacts.map((c: any, i: number) => (
                    <div key={c.id} className={`p-2.5 rounded border ${i === 0 ? 'border-primary/50 bg-primary/5' : 'border-border bg-bg-primary'}`}>
                      <div className="font-medium text-text-primary">
                        {c.firstName} {c.lastName} {i === 0 ? "(Keep Primary)" : "(Will Merge)"}
                      </div>
                      <div className="text-text-secondary truncate">{c.email || "No email"}</div>
                      <div className="text-text-secondary">{c.phone || "No phone"}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
