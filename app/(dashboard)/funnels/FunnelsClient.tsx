"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Plus,
  Globe,
  FileText,
  Layers,
  Users,
  Copy,
  Trash2,
  ExternalLink,
  Sparkles,
} from "lucide-react"
import { createFunnel, deleteFunnel, duplicateFunnel } from "@/app/actions/funnels"

function isLive(status: string | null | undefined) {
  const s = (status || "").toLowerCase()
  return s === "published" || s === "active"
}

export default function FunnelsClient({
  initialFunnels,
  agencyId: _agencyId,
  stats,
}: {
  initialFunnels: any[]
  agencyId: string
  stats: { capturedLeads: number }
}) {
  const [funnels, setFunnels] = useState<any[]>(initialFunnels)
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "archived">("all")
  const [busyId, setBusyId] = useState<string | null>(null)
  const router = useRouter()

  const filteredFunnels = funnels.filter((f) => {
    const matchesQuery =
      !searchTerm ||
      f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.subdomain?.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchesQuery) return false

    if (statusFilter === "all") return true
    const st = (f.status || "draft").toLowerCase()
    if (statusFilter === "published") return isLive(st)
    return st === statusFilter
  })

  const publishedCount = funnels.filter((f) => isLive(f.status)).length
  const totalPages = funnels.reduce((acc, f) => acc + (f.steps?.length || 0), 0)

  const handleCreate = async () => {
    setIsCreating(true)
    const res = await createFunnel("New Funnel")
    if (res.success && res.data) {
      router.push(`/funnels/${res.data.id}`)
    } else {
      toast.error(!res.success ? res.error : "Failed to create funnel")
      setIsCreating(false)
    }
  }

  const handleDuplicate = async (id: string) => {
    setBusyId(id)
    const res = await duplicateFunnel(id)
    setBusyId(null)
    if (res.success && res.data) {
      setFunnels((prev) => [res.data, ...prev])
      toast.success("Funnel duplicated")
    } else {
      toast.error(!res.success ? res.error : "Failed to duplicate funnel")
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}" and all its pages?`)) return
    setBusyId(id)
    const res = await deleteFunnel(id)
    setBusyId(null)
    if (res.success) {
      setFunnels((prev) => prev.filter((f) => f.id !== id))
      toast.success("Funnel deleted")
    } else {
      toast.error(!res.success ? res.error : "Failed to delete funnel")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Funnels &amp; Websites</h1>
          <p className="text-text-secondary">Build, publish, and manage conversion websites in one place.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/settings/domains">
            <Button variant="outline">
              <Globe className="w-4 h-4 mr-2" /> Connect Domain
            </Button>
          </Link>
          <Link href="/forge/vibecode">
            <Button variant="outline">
              <Sparkles className="w-4 h-4 mr-2 text-primary" /> Vibecode Lab
            </Button>
          </Link>
          <Button onClick={handleCreate} disabled={isCreating}>
            <Plus className="w-4 h-4 mr-2" /> {isCreating ? "Creating..." : "Create Funnel"}
          </Button>
        </div>
      </div>

      {/* Real KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">Total Sites &amp; Funnels</h3>
              <Layers className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-bold">{funnels.length}</div>
            <p className="text-xs text-text-secondary mt-1">In active workspace</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">Published Live</h3>
              <Globe className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-bold">{publishedCount}</div>
            <p className="text-xs text-text-secondary mt-1">
              {funnels.length - publishedCount} draft / archived
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">Total Pages</h3>
              <FileText className="w-4 h-4 text-secondary" />
            </div>
            <div className="text-3xl font-bold">{totalPages}</div>
            <p className="text-xs text-text-secondary mt-1">Across all funnels</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">Captured Leads</h3>
              <Users className="w-4 h-4 text-warning" />
            </div>
            <div className="text-3xl font-bold">{stats.capturedLeads}</div>
            <p className="text-xs text-text-secondary mt-1">CRM contacts from funnels</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3 py-2">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search funnels by name or subdomain..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="h-9 px-3 rounded-lg bg-bg-primary border border-border text-sm text-text-primary"
        >
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFunnels.map((funnel) => {
          const published = isLive(funnel.status)
          return (
            <Card key={funnel.id} className="hover:shadow-md transition-shadow group border border-border">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4 gap-2">
                  <Link href={`/funnels/${funnel.id}`} className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-text-primary group-hover:text-primary transition-colors truncate">
                      {funnel.name}
                    </h3>
                    <p className="text-xs text-text-secondary mt-1 font-mono truncate">
                      {funnel.customDomain || (funnel.subdomain ? `/f/${funnel.subdomain}` : "No subdomain connected")}
                    </p>
                  </Link>
                  <div className="flex items-center gap-1 shrink-0">
                    {published && funnel.subdomain && (
                      <a
                        href={`/f/${funnel.subdomain}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Open live funnel"
                        className="p-1.5 rounded-md text-text-secondary hover:text-primary hover:bg-bg-secondary"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      type="button"
                      disabled={busyId === funnel.id}
                      onClick={() => handleDuplicate(funnel.id)}
                      title="Duplicate funnel"
                      className="p-1.5 rounded-md text-text-secondary hover:text-primary hover:bg-bg-secondary"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={busyId === funnel.id}
                      onClick={() => handleDelete(funnel.id, funnel.name)}
                      title="Delete funnel"
                      className="p-1.5 rounded-md text-text-secondary hover:text-error hover:bg-bg-secondary"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Badge variant={published ? "success" : "secondary"} className="px-2 py-0 capitalize">
                    {(funnel.status || "draft").toLowerCase()}
                  </Badge>
                  <span className="text-xs font-medium text-text-secondary">
                    {funnel.steps?.length || 0} {(funnel.steps?.length || 0) === 1 ? "Page" : "Pages"}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border text-xs text-text-secondary">
                  <span>Updated {new Date(funnel.updatedAt).toLocaleDateString()}</span>
                  <Link href={`/funnels/${funnel.id}`} className="font-semibold text-primary hover:underline">
                    Open Studio →
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* Create New Card */}
        <div
          onClick={handleCreate}
          className="h-full border-2 border-dashed border-border bg-bg-secondary/50 hover:bg-primary/5 hover:border-primary/50 transition-colors cursor-pointer group flex flex-col items-center justify-center p-6 min-h-[190px] rounded-xl"
        >
          <div className="w-12 h-12 rounded-full bg-bg-primary border border-border flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-primary/50 group-hover:text-primary transition-all">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors">
            Create New Funnel
          </h3>
          <p className="text-sm text-text-secondary text-center mt-2 max-w-[200px]">
            Start blank or build multi-page funnels with AI
          </p>
        </div>
      </div>
    </div>
  )
}
