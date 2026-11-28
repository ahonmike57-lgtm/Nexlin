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
  ArrowUpRight,
  Globe,
  MousePointerClick,
  Eye,
  Sparkles,
  Copy,
  Trash2,
  ExternalLink,
} from "lucide-react"
import { createFunnel, deleteFunnel, duplicateFunnel } from "@/app/actions/funnels"

function isSitePublished(status: string | null | undefined) {
  const s = (status || "").toLowerCase()
  return s === "published" || s === "active"
}

export default function WebsitesClient({
  initialWebsites,
  agencyId: _agencyId,
}: {
  initialWebsites: any[]
  agencyId: string
}) {
  const [websites, setWebsites] = useState<any[]>(initialWebsites)
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "archived">("all")
  const [busyId, setBusyId] = useState<string | null>(null)
  const router = useRouter()

  const handleCreate = async () => {
    setIsCreating(true)
    const res = await createFunnel("New Website")
    if (res.success && res.data) {
      router.push(`/funnels/${res.data.id}`)
    } else {
      toast.error(!res.success ? res.error : "Failed to create website")
      setIsCreating(false)
    }
  }

  const handleDuplicate = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    setBusyId(id)
    const res = await duplicateFunnel(id)
    setBusyId(null)
    if (res.success && res.data) {
      setWebsites((prev) => [res.data, ...prev])
      toast.success("Website duplicated")
    } else {
      toast.error(!res.success ? res.error : "Failed to duplicate website")
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm(`Delete "${name}" and all its pages?`)) return
    setBusyId(id)
    const res = await deleteFunnel(id)
    setBusyId(null)
    if (res.success) {
      setWebsites((prev) => prev.filter((w) => w.id !== id))
      toast.success("Website deleted")
    } else {
      toast.error(!res.success ? res.error : "Failed to delete website")
    }
  }

  const filteredWebsites = websites.filter((w) => {
    const matchesSearch =
      !searchTerm ||
      w.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.subdomain?.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchesSearch) return false

    if (statusFilter === "all") return true
    const st = (w.status || "draft").toLowerCase()
    if (statusFilter === "published") return isSitePublished(st)
    return st === statusFilter
  })

  const publishedSites = websites.filter((w) => isSitePublished(w.status)).length
  const customDomainCount = websites.filter((w) => w.customDomain).length
  const totalPages = websites.reduce((acc, w) => acc + (w.steps?.length || 1), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Websites</h1>
          <p className="text-text-secondary">Build multi-page websites & landing pages with the unified AI Studio.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/forge">
            <Button variant="outline">
              <Sparkles className="w-4 h-4 mr-2 text-primary" /> AI Studio
            </Button>
          </Link>
          <Link href="/websites/blogs">
            <Button variant="outline">
              <Globe className="w-4 h-4 mr-2" /> Blogs & CMS
            </Button>
          </Link>
          <Button onClick={handleCreate} disabled={isCreating}>
            <Plus className="w-4 h-4 mr-2" /> {isCreating ? "Creating..." : "Create Website"}
          </Button>
        </div>
      </div>

      {/* Real Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">Published Sites</h3>
              <Eye className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-bold">
              {publishedSites} <span className="text-xs text-text-secondary font-normal">/ {websites.length} total</span>
            </div>
            <p className="text-xs text-success flex items-center mt-1">
              <ArrowUpRight className="w-3 h-3 mr-1" /> Active online
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">Custom Domains Linked</h3>
              <Globe className="w-4 h-4 text-secondary" />
            </div>
            <div className="text-3xl font-bold">{customDomainCount}</div>
            <p className="text-xs text-text-secondary mt-1">
              <Link href="/settings/domains" className="hover:underline">Manage custom domains →</Link>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">Total Pages &amp; Funnel Steps</h3>
              <MousePointerClick className="w-4 h-4 text-warning" />
            </div>
            <div className="text-3xl font-bold">{totalPages}</div>
            <p className="text-xs text-text-secondary mt-1">Across all workspaces</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3 py-2">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search websites by name or subdomain..."
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
        {filteredWebsites.map((website) => {
          const live = isSitePublished(website.status)
          return (
            <Card key={website.id} className="hover:shadow-md transition-shadow group border border-border">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4 gap-2">
                  <Link href={`/funnels/${website.id}`} className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-text-primary group-hover:text-primary transition-colors truncate">
                      {website.name}
                    </h3>
                    <p className="text-xs text-text-secondary mt-1 font-mono truncate">
                      {website.customDomain || (website.subdomain ? `/f/${website.subdomain}` : "No subdomain")}
                    </p>
                  </Link>
                  <div className="flex items-center gap-1 shrink-0">
                    {live && website.subdomain && (
                      <a
                        href={`/f/${website.subdomain}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Open live website"
                        className="p-1.5 rounded-md text-text-secondary hover:text-primary hover:bg-bg-secondary"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      type="button"
                      disabled={busyId === website.id}
                      onClick={(e) => handleDuplicate(e, website.id)}
                      title="Duplicate website"
                      className="p-1.5 rounded-md text-text-secondary hover:text-primary hover:bg-bg-secondary"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={busyId === website.id}
                      onClick={(e) => handleDelete(e, website.id, website.name)}
                      title="Delete website"
                      className="p-1.5 rounded-md text-text-secondary hover:text-error hover:bg-bg-secondary"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Badge variant={live ? "success" : "secondary"} className="px-2 py-0 capitalize">
                      {(website.status || "draft").toLowerCase()}
                    </Badge>
                    <span className="text-xs font-medium text-text-secondary">
                      {website.steps?.length || 1} {(website.steps?.length || 1) === 1 ? "Page" : "Pages"}
                    </span>
                  </div>
                  <Link href={`/funnels/${website.id}`} className="text-xs font-semibold text-primary hover:underline">
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
          className="h-full border-2 border-dashed border-border bg-bg-secondary/50 hover:bg-primary/5 hover:border-primary/50 transition-colors cursor-pointer group flex flex-col items-center justify-center p-6 min-h-[180px] rounded-xl"
        >
          <div className="w-12 h-12 rounded-full bg-bg-primary border border-border flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-primary/50 group-hover:text-primary transition-all">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors">
            Create New Website
          </h3>
          <p className="text-sm text-text-secondary text-center mt-2 max-w-[220px]">
            Start blank or build multi-page layouts with AI
          </p>
        </div>
      </div>
    </div>
  )
}
