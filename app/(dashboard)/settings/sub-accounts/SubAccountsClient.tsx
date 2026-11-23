"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Plus,
  Building2,
  Trash2,
  Users,
  Kanban,
  Globe,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Sparkles
} from "lucide-react"
import Link from "next/link"
import { createSubAccount, deleteSubAccount, setActiveSubAccount } from "@/app/actions/subaccounts"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function SubAccountsClient({
  initialSubAccounts,
  agencyId,
  activeSubAccountId
}: {
  initialSubAccounts: any[]
  agencyId: string
  activeSubAccountId?: string | null
}) {
  const [subAccounts, setSubAccounts] = useState(initialSubAccounts || [])
  const [activeId, setActiveId] = useState<string | null>(activeSubAccountId || null)
  const [isCreating, setIsCreating] = useState(false)
  const [switchingId, setSwitchingId] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const router = useRouter()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return toast.error("Client or Business Name is required")

    setIsCreating(true)
    const res = await createSubAccount(agencyId, newName.trim())
    setIsCreating(false)

    if (res.success && res.data) {
      toast.success(`Sub-account "${newName}" created successfully!`)
      setSubAccounts([{ ...res.data, _count: { contacts: 0, deals: 0, funnels: 0 } }, ...subAccounts])
      setNewName("")
      setNewEmail("")
      router.refresh()
    } else {
      toast.error(res.error || "Failed to create sub-account")
    }
  }

  const handleSwitchWorkspace = async (subAccountId: string | null) => {
    setSwitchingId(subAccountId || "master")
    const res = await setActiveSubAccount(subAccountId)
    setSwitchingId(null)

    if (res.success) {
      setActiveId(subAccountId)
      toast.success(
        subAccountId
          ? "Switched to client sub-account workspace!"
          : "Switched back to Master Agency workspace!"
      )
      router.refresh()
    } else {
      toast.error("Failed to switch workspace")
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete sub-account "${name}"? This removes all isolated client records and cannot be undone.`)) {
      return
    }

    const res = await deleteSubAccount(id)
    if (res.success) {
      toast.success(`Sub-account "${name}" deleted.`)
      setSubAccounts(subAccounts.filter((s: any) => s.id !== id))
      if (activeId === id) {
        await setActiveSubAccount(null)
        setActiveId(null)
      }
      router.refresh()
    } else {
      toast.error(res.error || "Failed to delete sub-account")
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Client Sub-Accounts</h2>
          <p className="text-text-secondary text-sm">
            Provision and manage multi-tenant isolated client workspaces with dedicated CRMs and funnels.
          </p>
        </div>

        {activeId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSwitchWorkspace(null)}
            disabled={switchingId === "master"}
            className="text-xs h-9 flex items-center gap-1.5 border-primary/40 text-primary"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Return to Master Agency</span>
          </Button>
        )}
      </div>

      {/* Creation Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" /> Provision New Client Workspace
          </CardTitle>
          <CardDescription>
            Creates an isolated database silo with dedicated contacts, deal pipelines, and custom subdomains.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="e.g. Miller Dental Practice"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 text-xs"
              required
            />
            <Button type="submit" disabled={isCreating} className="whitespace-nowrap text-xs h-10 px-5 font-semibold">
              {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
              Provision Workspace
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sub-Accounts Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary flex items-center justify-between">
          <span>Active Sub-Accounts ({subAccounts.length})</span>
          <span className="text-xs font-normal text-text-muted">Multi-Tenant Isolation Active</span>
        </h3>

        {subAccounts.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-border rounded-2xl space-y-2 bg-bg-card/40">
            <Building2 className="w-8 h-8 text-text-muted mx-auto" />
            <h4 className="font-semibold text-sm">No client sub-accounts created yet</h4>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              Provision your first client workspace above to manage isolated pipelines and telephony numbers.
            </p>
          </div>
        ) : (
          subAccounts.map((sub: any) => {
            const isCurrentActive = activeId === sub.id
            const isSwitching = switchingId === sub.id

            return (
              <Card
                key={sub.id}
                className={`p-5 transition-all duration-200 ${
                  isCurrentActive ? "border-primary/60 bg-primary/5 shadow-md" : "border-border/80 hover:border-border"
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-primary/20 to-blue-600/20 text-primary flex items-center justify-center font-bold text-base shadow-inner">
                      {sub.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-text-primary">{sub.name}</h4>
                        {isCurrentActive ? (
                          <Badge className="bg-primary/20 text-primary border-primary/40 text-[10px] px-2 py-0.5">
                            Active Session
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-text-muted border-border">
                            ID: {sub.id.slice(-6)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Created {new Date(sub.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  {/* Telemetry Badges */}
                  <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <span className="flex items-center gap-1 bg-bg-secondary px-2.5 py-1 rounded-lg border border-border/60">
                        <Users className="w-3 h-3 text-primary" /> {sub._count?.contacts || 0} Contacts
                      </span>
                      <span className="flex items-center gap-1 bg-bg-secondary px-2.5 py-1 rounded-lg border border-border/60">
                        <Kanban className="w-3 h-3 text-emerald-400" /> {sub._count?.deals || 0} Deals
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isCurrentActive ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSwitchWorkspace(null)}
                          disabled={switchingId === "master"}
                          className="text-xs h-8 px-3"
                        >
                          Exit
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSwitchWorkspace(sub.id)}
                          disabled={isSwitching}
                          className="text-xs h-8 px-3 flex items-center gap-1 text-primary hover:bg-primary/10 border-primary/30"
                        >
                          {isSwitching ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
                          Switch In
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(sub.id, sub.name)}
                        className="h-8 w-8 text-text-muted hover:text-error hover:bg-error/10"
                        title="Delete Sub-Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
