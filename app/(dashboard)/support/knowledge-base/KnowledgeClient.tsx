"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  BookOpen,
  Search,
  ArrowRight,
  Sparkles,
  Edit2,
  Trash2,
  Copy,
  Check,
  Eye,
  Folder,
  ArrowLeft,
  Loader2,
  ExternalLink
} from "lucide-react"
import {
  createKnowledgeArticle,
  updateKnowledgeArticle,
  deleteKnowledgeArticle
} from "@/app/actions/knowledge"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { format } from "date-fns"

interface ArticleItem {
  id: string
  title: string
  content: string
  category: string
  status: string
  createdAt: any
  updatedAt?: any
}

interface KnowledgeClientProps {
  initialArticles: ArticleItem[]
  agencyId: string
}

export default function KnowledgeClient({ initialArticles, agencyId }: KnowledgeClientProps) {
  const [articles, setArticles] = useState<ArticleItem[]>(initialArticles)
  const [selectedArticle, setSelectedArticle] = useState<ArticleItem | null>(null)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Create Article State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newArticle, setNewArticle] = useState({ title: "", content: "", category: "Getting Started" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Edit Article State
  const [editingArticle, setEditingArticle] = useState<ArticleItem | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const [copiedId, setCopiedId] = useState<string | null>(null)

  const categories = [
    "all",
    "Getting Started",
    "Billing & Invoicing",
    "Integrations & API",
    "Workflows & Automations",
    "Voice AI & Telephony",
    "Troubleshooting"
  ]

  const handleCreateArticle = async () => {
    if (!newArticle.title.trim()) return toast.error("Article title is required.")
    if (!newArticle.content.trim()) return toast.error("Article content is required.")

    setIsSubmitting(true)
    try {
      const res = await createKnowledgeArticle(agencyId, {
        title: newArticle.title,
        content: newArticle.content,
        category: newArticle.category || "General"
      })

      if (res.success && res.article) {
        toast.success("Article published successfully!")
        setArticles([res.article as any, ...articles])
        setIsCreateOpen(false)
        setNewArticle({ title: "", content: "", category: "Getting Started" })
      } else {
        toast.error(res.error || "Failed to create article.")
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateArticle = async () => {
    if (!editingArticle || !editingArticle.title.trim()) return toast.error("Title is required")

    setIsSubmitting(true)
    try {
      const res = await updateKnowledgeArticle(editingArticle.id, {
        title: editingArticle.title,
        content: editingArticle.content,
        category: editingArticle.category
      })

      if (res.success && res.article) {
        toast.success("Article updated successfully!")
        setArticles(articles.map(a => a.id === editingArticle.id ? res.article as any : a))
        if (selectedArticle?.id === editingArticle.id) setSelectedArticle(res.article as any)
        setIsEditOpen(false)
        setEditingArticle(null)
      } else {
        toast.error(res.error || "Failed to update article")
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteArticle = async (id: string) => {
    if (!confirm("Are you sure you want to delete this help article?")) return

    try {
      const res = await deleteKnowledgeArticle(id)
      if (res.success) {
        toast.success("Article deleted")
        setArticles(articles.filter(a => a.id !== id))
        if (selectedArticle?.id === id) setSelectedArticle(null)
      } else {
        toast.error(res.error || "Failed to delete article")
      }
    } catch (err: any) {
      toast.error("Error deleting article")
    }
  }

  const handleCopyLink = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/support/knowledge-base?article=${id}`)
    setCopiedId(id)
    toast.success("Article link copied to clipboard!")
    setTimeout(() => setCopiedId(null), 2500)
  }

  const filteredArticles = articles.filter(a => {
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())

    const matchesCategory =
      selectedCategory === "all" ||
      a.category.toLowerCase() === selectedCategory.toLowerCase()

    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/support" className="text-text-secondary hover:text-text-primary text-xs flex items-center gap-1 font-semibold">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Help Desk
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary mt-1 flex items-center gap-2.5">
            <BookOpen className="h-8 w-8 text-primary" />
            Knowledge Base & Documentation
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Author and publish help center articles used by clients and your AI Copilot.
          </p>
        </div>

        {/* Create Article Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary text-white">
              <Plus className="mr-1.5 h-4 w-4" /> New Article
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[680px]">
            <DialogHeader>
              <DialogTitle>Publish New Knowledge Article</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Article Title *</label>
                <Input
                  placeholder="e.g. How to Connect Custom Domains and SSL Certificates"
                  value={newArticle.title}
                  onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Category</label>
                <select
                  className="w-full h-9 rounded-md border border-border bg-bg-primary px-3 text-xs text-text-primary"
                  value={newArticle.category}
                  onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
                >
                  {categories.filter(c => c !== "all").map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Content (Markdown Supported) *</label>
                <textarea
                  className="w-full min-h-[220px] rounded-md border border-border bg-bg-primary p-3 text-xs text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Write clear, step-by-step instructions. Supports markdown headings (#), bullets (-), and code snippets..."
                  value={newArticle.content}
                  onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="ghost" size="sm" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={handleCreateArticle} disabled={isSubmitting} className="bg-primary text-white">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                  Publish Article
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Category Filter Pills */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <Input
            placeholder="Search documentation by keyword or category..."
            className="pl-9 h-9 text-xs bg-bg-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-colors ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? "bg-primary text-white"
                  : "bg-bg-secondary text-text-secondary hover:bg-border"
              }`}
            >
              {cat === "all" ? "All Categories" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Articles Grid & Reader Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Article Cards (8 cols or 12 cols if no selection) */}
        <div className={selectedArticle ? "lg:col-span-6 space-y-3" : "lg:col-span-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4"}>
          {filteredArticles.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-border bg-bg-primary p-12 text-center">
              <BookOpen className="w-12 h-12 text-border mx-auto mb-3" />
              <h3 className="text-base font-bold text-text-primary">No Articles Found</h3>
              <p className="text-xs text-text-secondary mt-1">
                {search ? "No documentation matched your search." : "Publish your first knowledge base article to get started!"}
              </p>
            </div>
          ) : (
            filteredArticles.map((article) => {
              const isSelected = selectedArticle?.id === article.id

              return (
                <div
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className={`rounded-2xl border bg-bg-primary p-5 shadow-sm cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/20 bg-primary/5">
                        {article.category}
                      </Badge>
                      <span className="text-[10px] text-text-secondary">
                        {format(new Date(article.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-text-primary line-clamp-2 mb-2">
                      {article.title}
                    </h3>

                    <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed mb-4">
                      {article.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border text-xs">
                    <span className="text-primary font-semibold flex items-center gap-1">
                      Read Article <ArrowRight className="w-3.5 h-3.5" />
                    </span>

                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-text-secondary hover:text-text-primary"
                        onClick={() => handleCopyLink(article.id)}
                      >
                        {copiedId === article.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-text-secondary hover:text-text-primary"
                        onClick={() => {
                          setEditingArticle(article)
                          setIsEditOpen(true)
                        }}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-500 hover:bg-red-500/10"
                        onClick={() => handleDeleteArticle(article.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Selected Article Live Reader (6 cols) */}
        {selectedArticle && (
          <div className="lg:col-span-6 rounded-2xl border border-border bg-bg-primary p-6 shadow-sm space-y-5 sticky top-20 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="space-y-1">
                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-bold">
                  {selectedArticle.category}
                </Badge>
                <h2 className="text-xl font-bold text-text-primary">
                  {selectedArticle.title}
                </h2>
                <p className="text-xs text-text-secondary">
                  Published on {format(new Date(selectedArticle.createdAt), "MMMM d, yyyy")}
                </p>
              </div>

              <Button
                size="sm"
                variant="ghost"
                className="text-text-secondary text-xs"
                onClick={() => setSelectedArticle(null)}
              >
                ✕ Close
              </Button>
            </div>

            {/* Render Article Markdown Text */}
            <div className="prose prose-sm dark:prose-invert max-w-none text-text-primary text-xs leading-relaxed whitespace-pre-wrap">
              {selectedArticle.content}
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopyLink(selectedArticle.id)}
                className="text-xs"
              >
                <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Shareable Link
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingArticle(selectedArticle)
                    setIsEditOpen(true)
                  }}
                  className="text-xs"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteArticle(selectedArticle.id)}
                  className="text-xs text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Article Dialog */}
      {editingArticle && (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[680px]">
            <DialogHeader>
              <DialogTitle>Edit Knowledge Article</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Article Title *</label>
                <Input
                  value={editingArticle.title}
                  onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Category</label>
                <select
                  className="w-full h-9 rounded-md border border-border bg-bg-primary px-3 text-xs text-text-primary"
                  value={editingArticle.category}
                  onChange={(e) => setEditingArticle({ ...editingArticle, category: e.target.value })}
                >
                  {categories.filter(c => c !== "all").map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Content (Markdown Supported) *</label>
                <textarea
                  className="w-full min-h-[220px] rounded-md border border-border bg-bg-primary p-3 text-xs text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  value={editingArticle.content}
                  onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="ghost" size="sm" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={handleUpdateArticle} disabled={isSubmitting} className="bg-primary text-white">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
