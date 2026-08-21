"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Download, MoreHorizontal, Mail, Phone, Flame, Sparkles, Building2, Globe, Cpu, Users2, DollarSign, Target, CheckCircle2, Loader2 } from "lucide-react"
import AddContactModal from "./AddContactModal"
import { MergeContactsDialog } from "@/components/crm/MergeContactsDialog"
import { PowerDialer } from "@/components/crm/PowerDialer"
import { enrichContact, EnrichedFirmographics } from "@/app/actions/enrichment"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "sonner"

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-red-500 bg-red-500/10 border-red-500/20";
  if (score >= 50) return "text-orange-500 bg-orange-500/10 border-orange-500/20";
  if (score >= 20) return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
  return "text-blue-500 bg-blue-500/10 border-blue-500/20";
};

export default function ContactsClient({ initialContacts }: { initialContacts: any[] }) {
  const [contacts, setContacts] = useState(initialContacts)
  const [searchTerm, setSearchTerm] = useState("")

  // Enrichment Modal State
  const [enrichingId, setEnrichingId] = useState<string | null>(null)
  const [activeEnrichment, setActiveEnrichment] = useState<{
    contact: any
    data: EnrichedFirmographics
  } | null>(null)

  const handleEnrich = async (contact: any) => {
    setEnrichingId(contact.id)
    const res = await enrichContact(contact.id)
    setEnrichingId(null)

    if (res.success && res.data) {
      toast.success(`Enriched firmographics for ${contact.firstName}!`)
      setActiveEnrichment({
        contact,
        data: res.data.firmographics
      })
      if (res.data.firmographics.companyName && !contact.company) {
        setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, company: res.data.firmographics.companyName } : c))
      }
    } else {
      toast.error('error' in res ? res.error : "Enrichment failed")
    }
  }

  const filtered = contacts.filter((c) => {
    if (!searchTerm) return true
    const q = searchTerm.toLowerCase()
    const fullName = `${c.firstName || ""} ${c.lastName || ""}`.trim()
    return (
      fullName.toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.company || "").toLowerCase().includes(q)
    )
  })

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-text-secondary">Manage your leads with 1-click B2B firmographic enrichment ({contacts.length} total).</p>
        </div>
        <div className="flex gap-2 items-center">
          <PowerDialer contacts={contacts} />
          <MergeContactsDialog />
          <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export</Button>
          <AddContactModal />
        </div>
      </div>

      <div className="bg-bg-primary rounded-xl shadow-soft border border-border flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-bg-secondary/50">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <Input 
              placeholder="Search by name, email, or company..." 
              className="pl-9 bg-bg-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" className="bg-bg-primary"><Filter className="w-4 h-4 mr-2" /> Filters</Button>
            <Button variant="outline" size="sm" className="bg-bg-primary">Columns</Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-secondary uppercase bg-bg-secondary/80 sticky top-0">
              <tr>
                <th className="px-6 py-3 font-semibold">
                  <input type="checkbox" className="rounded border-border" />
                </th>
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-6 py-3 font-semibold">Contact Info</th>
                <th className="px-6 py-3 font-semibold">Company</th>
                <th className="px-6 py-3 font-semibold">Lead Score</th>
                <th className="px-6 py-3 font-semibold">Enrichment</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-text-secondary">
                    {searchTerm ? `No contacts match "${searchTerm}".` : 'No contacts found. Click "Add Contact" to create one.'}
                  </td>
                </tr>
              )}
              {filtered.map((contact) => (
                <tr key={contact.id} className="hover:bg-bg-secondary/50 transition-colors cursor-pointer group">
                  <td className="px-6 py-4">
                    <input type="checkbox" className="rounded border-border" />
                  </td>
                  <td className="px-6 py-4 font-medium text-text-primary">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {contact.firstName?.charAt(0) || "U"}
                      </div>
                      <div>
                        <div>{contact.firstName} {contact.lastName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-text-secondary">
                      <span className="flex items-center gap-1 hover:text-primary"><Mail className="w-3 h-3" /> {contact.email || "-"}</span>
                      {contact.phone && <span className="flex items-center gap-1 hover:text-primary"><Phone className="w-3 h-3" /> {contact.phone}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-secondary font-medium">{contact.company || "-"}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <Badge variant="outline" className={`font-medium ${getScoreColor(contact.leadScore || 0)}`}>
                         <Flame className="w-3 h-3 mr-1" />
                         {contact.leadScore || 0}
                       </Badge>
                       <div className="w-16 h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                         <div 
                           className={`h-full ${contact.leadScore >= 80 ? 'bg-red-500' : contact.leadScore >= 50 ? 'bg-orange-500' : contact.leadScore >= 20 ? 'bg-yellow-500' : 'bg-blue-500'}`} 
                           style={{ width: `${Math.min(contact.leadScore || 0, 100)}%` }}
                         />
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEnrich(contact)
                      }}
                      disabled={enrichingId === contact.id}
                      className="h-7 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                    >
                      {enrichingId === contact.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3 text-primary" />
                      )}
                      {enrichingId === contact.id ? "Enriching..." : "Enrich"}
                    </Button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-border flex items-center justify-between text-sm text-text-secondary bg-bg-secondary/50">
          <div>Showing {filtered.length} of {contacts.length} contacts{searchTerm ? ` matching "${searchTerm}"` : ""}</div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="bg-primary text-white border-primary">1</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </div>
      </div>

      {/* Firmographics Drawer Dialog */}
      {activeEnrichment && (
        <Dialog open={!!activeEnrichment} onOpenChange={() => setActiveEnrichment(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                {activeEnrichment.data.companyName}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 pt-1 font-mono text-xs">
                <Globe className="w-3.5 h-3.5" /> {activeEnrichment.data.domain} · {activeEnrichment.data.industry}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-sm">
              {/* Firmographics Matrix */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-bg-secondary p-3 rounded-xl border border-border">
                  <p className="text-xs text-text-secondary flex items-center gap-1">
                    <Users2 className="w-3.5 h-3.5" /> Company Size
                  </p>
                  <p className="text-sm font-semibold mt-1 text-text-primary">
                    {activeEnrichment.data.employeeRange}
                  </p>
                </div>

                <div className="bg-bg-secondary p-3 rounded-xl border border-border">
                  <p className="text-xs text-text-secondary flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> Estimated Revenue
                  </p>
                  <p className="text-sm font-semibold mt-1 text-success">
                    {activeEnrichment.data.estimatedRevenue}
                  </p>
                </div>
              </div>

              {/* Buyer Persona & Pain Points */}
              <div className="bg-bg-secondary p-3.5 rounded-xl border border-border space-y-2">
                <p className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-primary" /> Buyer Persona
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {activeEnrichment.data.buyerPersona}
                </p>
              </div>

              {/* Tech Stack */}
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5" /> Detected Tech Stack
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {activeEnrichment.data.techStack?.map((tech, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs font-medium">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Suggested Pitch Hook */}
              <div className="bg-primary/5 border border-primary/20 p-3.5 rounded-xl space-y-1">
                <p className="text-xs font-bold text-primary flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> AI Recommended Pitch
                </p>
                <p className="text-xs text-text-primary leading-relaxed">
                  &ldquo;{activeEnrichment.data.suggestedPitch}&rdquo;
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

