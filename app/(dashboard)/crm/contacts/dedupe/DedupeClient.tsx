"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, GitMerge, CheckCircle, ArrowLeft, RefreshCw, ShieldCheck, Sparkles, Loader2 } from "lucide-react"
import { mergeContacts, findDuplicateContacts, autoMergeAllDuplicates } from "@/app/actions/contacts-dedupe"
import Link from "next/link"
import { toast } from "sonner"

export default function DedupeClient({ initialDuplicates }: { initialDuplicates: any[] }) {
  const [duplicates, setDuplicates] = useState<any[]>(initialDuplicates)
  const [mergingId, setMergingId] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isAutoMerging, setIsAutoMerging] = useState(false)

  const handleScan = async () => {
    setIsScanning(true)
    const res = await findDuplicateContacts()
    if (res.success && 'data' in res && res.data) {
      setDuplicates(res.data)
      toast.success(`Found ${res.data.length} duplicate lead groups.`)
    }
    setIsScanning(false)
  }

  const handleMergeGroup = async (targetId: string, sourceIds: string[], groupIndex: number) => {
    setMergingId(targetId)
    const res = await mergeContacts(targetId, sourceIds)
    setMergingId(null)

    if (res.success) {
      toast.success("Contacts merged successfully!")
      setDuplicates(prev => prev.filter((_, i) => i !== groupIndex))
    } else {
      toast.error('error' in res ? res.error : "Merge failed")
    }
  }

  const handleAutoMergeAll = async () => {
    setIsAutoMerging(true)
    const res = await autoMergeAllDuplicates()
    setIsAutoMerging(false)

    if (res.success && res.data) {
      toast.success(`Auto-merged ${res.data.mergedCount} duplicate contacts across all deals & tasks!`)
      setDuplicates([])
    } else {
      toast.error('error' in res ? res.error : "Auto-merge failed")
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/crm/contacts" className="p-2 rounded-lg border border-border hover:bg-bg-secondary text-text-secondary">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Lead Hygiene & Contact Deduplication</h1>
            <p className="text-sm text-text-secondary">Automatically find and merge duplicate leads by phone and email.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {duplicates.length > 0 && (
            <Button
              onClick={handleAutoMergeAll}
              disabled={isAutoMerging}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              {isAutoMerging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isAutoMerging ? "Merging All…" : "Auto-Merge All Exact Matches"}
            </Button>
          )}
          <Button variant="outline" onClick={handleScan} disabled={isScanning} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? "Scanning..." : "Rescan Duplicates"}
          </Button>
        </div>
      </div>

      {duplicates.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-3">
            <CheckCircle className="w-12 h-12 text-success mx-auto" />
            <h3 className="text-lg font-bold">Your Contact Database is Clean!</h3>
            <p className="text-sm text-text-secondary">No duplicate email or phone number groups detected.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {duplicates.map((group, groupIdx) => {
            const primary = group.contacts[0]
            const sources = group.contacts.slice(1).map((c: any) => c.id)

            return (
              <Card key={groupIdx} className="border-amber-500/20 bg-amber-500/5">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-500" />
                      Duplicate Group ({group.field.toUpperCase()}: <span className="font-mono text-primary">{group.value}</span>)
                    </CardTitle>
                    <CardDescription>{group.contacts.length} matching contact profiles found</CardDescription>
                  </div>

                  <Button
                    onClick={() => handleMergeGroup(primary.id, sources, groupIdx)}
                    disabled={mergingId === primary.id}
                    className="gap-2 bg-primary text-white"
                  >
                    <GitMerge className="w-4 h-4" />
                    {mergingId === primary.id ? "Merging..." : "Merge Profiles into Primary"}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {group.contacts.map((c: any, cIdx: number) => (
                      <div key={c.id} className={`p-3 rounded-lg border text-xs space-y-1 ${cIdx === 0 ? 'border-primary bg-primary/10' : 'border-border bg-bg-primary'}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{c.firstName} {c.lastName || ''}</span>
                          {cIdx === 0 && <span className="text-[10px] uppercase font-bold text-primary font-mono">Primary Record</span>}
                        </div>
                        <p className="text-text-secondary font-mono">{c.email || 'No email'}</p>
                        <p className="text-text-secondary font-mono">{c.phone || 'No phone'}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
