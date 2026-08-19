"use client"

import { useState, useEffect } from "react"
import { VIBECODE_PROMPTS } from "@/lib/vibecode-prompts"
import { listSavedPrompts, deletePromptTemplate } from "@/app/actions/prompts"
import { toast } from "sonner"
import { Library, Search, Trash2, Copy, ExternalLink, Star, User, ChevronRight, Loader2 } from "lucide-react"
import Link from "next/link"

type SavedPrompt = {
  id: string
  name: string
  description: string | null
  createdAt: Date
}

type ParsedPrompt = {
  type?: string
  category?: string
  prompt?: string
}

const ALL_CATEGORIES = ["All", "Landing Pages", "CRM Widgets", "Email Templates", "Automations", "Forms", "Voice AI"]

export default function PromptsClient() {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const [tab, setTab] = useState<"library" | "saved">("library")
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([])
  const [loadingSaved, setLoadingSaved] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (tab === "saved") {
      loadSaved()
    }
  }, [tab])

  const loadSaved = async () => {
    setLoadingSaved(true)
    const res = await listSavedPrompts()
    setLoadingSaved(false)
    if (res.success) {
      setSavedPrompts(res.data)
    } else {
      toast.error(res.error)
    }
  }

  const handleDelete = async (id: string) => {
    const res = await deletePromptTemplate(id)
    if (res.success) {
      toast.success("Prompt deleted")
      setSavedPrompts((prev) => prev.filter((p) => p.id !== id))
    } else {
      toast.error(res.error)
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success("Prompt copied!")
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Filter built-in prompts
  const filtered = VIBECODE_PROMPTS.filter((p) => {
    const matchesCategory = activeCategory === "All" || p.category === activeCategory
    const matchesSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.prompt.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Parse saved prompt metadata
  const parseSaved = (s: SavedPrompt): { category: string; prompt: string } => {
    try {
      const m = JSON.parse(s.description ?? "{}") as ParsedPrompt
      return { category: m.category ?? "Other", prompt: m.prompt ?? "" }
    } catch {
      return { category: "Other", prompt: "" }
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Library className="w-6 h-6 text-primary" />
            Prompt Library
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Curated vibecode prompts for building CRM components, pages, emails, and automations
          </p>
        </div>
        <Link
          href="/forge/vibecode"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Open Vibecode Lab
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-bg-secondary rounded-xl w-fit">
        {(["library", "saved"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              tab === t ? "bg-bg-primary text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {t === "library" ? `Built-in (${VIBECODE_PROMPTS.length})` : "My Saved"}
          </button>
        ))}
      </div>

      {tab === "library" ? (
        <>
          {/* Search + Category Filter */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search prompts..."
                className="w-full pl-9 pr-4 py-2 bg-bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    activeCategory === cat
                      ? "bg-primary text-white border-primary"
                      : "border-border text-text-secondary hover:border-primary/50 hover:text-primary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((prompt) => (
              <div
                key={prompt.id}
                className="bg-bg-primary border border-border rounded-xl p-4 hover:border-primary/30 transition-colors group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {prompt.category}
                    </span>
                    <h3 className="text-sm font-semibold text-text-primary mt-2">{prompt.title}</h3>
                  </div>
                  <Star className="w-4 h-4 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-text-secondary leading-relaxed line-clamp-3 mb-4">{prompt.prompt}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(prompt.prompt, prompt.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-border text-xs text-text-secondary hover:text-primary hover:border-primary/50 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedId === prompt.id ? "Copied!" : "Copy"}
                  </button>
                  <Link
                    href={`/forge/vibecode?prompt=${encodeURIComponent(prompt.prompt)}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                  >
                    Use in Lab
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-3 text-center py-16 text-text-secondary">
                <Library className="w-10 h-10 opacity-20 mx-auto mb-3" />
                <p>No prompts match your filters</p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Saved Prompts */
        <div>
          {loadingSaved ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : savedPrompts.length === 0 ? (
            <div className="text-center py-16 text-text-secondary">
              <User className="w-10 h-10 opacity-20 mx-auto mb-3" />
              <p className="font-medium">No saved prompts yet</p>
              <p className="text-xs mt-1 opacity-70">Save prompts from the Vibecode Lab to find them here</p>
              <Link href="/forge/vibecode" className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                Open Vibecode Lab <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedPrompts.map((s) => {
                const { category, prompt } = parseSaved(s)
                return (
                  <div key={s.id} className="bg-bg-primary border border-border rounded-xl p-4 hover:border-primary/30 transition-colors group">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{category}</span>
                        <h3 className="text-sm font-semibold text-text-primary mt-2">{s.name}</h3>
                      </div>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-text-secondary hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-3 mb-4">{prompt}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(prompt, s.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-border text-xs text-text-secondary hover:text-primary hover:border-primary/50 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copiedId === s.id ? "Copied!" : "Copy"}
                      </button>
                      <Link
                        href={`/forge/vibecode?prompt=${encodeURIComponent(prompt)}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                      >
                        Use in Lab
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
