"use client"

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  Check,
  Code2,
  Copy,
  ExternalLink,
  Eye,
  FilePlus2,
  Globe,
  History,
  Layers,
  Loader2,
  Mic,
  MicOff,
  Monitor,
  Plus,
  RotateCcw,
  Save,
  Settings2,
  Smartphone,
  Sparkles,
  Tablet,
  Trash2,
  Wand2,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  addFunnelStep,
  createFunnel,
  deleteFunnelStep,
  generateWebsitePageWithAi,
  updateFunnelMetadata,
  updateFunnelStep,
  type BuilderTheme,
  type StepConfigMeta,
  type StepHistoryEntry,
} from "@/app/actions/funnels"

export interface BuilderStep {
  id: string
  funnelId: string
  name: string
  path: string
  order: number
  content: string | null
  config: string | null
}

export interface BuilderSite {
  id: string
  name: string
  subdomain: string | null
  customDomain?: string | null
  status: string
  steps: BuilderStep[]
}

const STARTER_TEMPLATES = [
  {
    id: "agency-hero",
    title: "Agency Landing Page",
    prompt:
      "Build a high-converting digital marketing agency landing page with a crisp hero value proposition, 3 core service pillars, client results metrics, and a consultation booking form.",
  },
  {
    id: "local-booking",
    title: "Local Business Booking",
    prompt:
      "Build a trustworthy local service business website with transparent service tiers, 5-star customer testimonials, service area coverage, and an instant quote & callback form.",
  },
  {
    id: "saas-pricing",
    title: "SaaS Product & Pricing",
    prompt:
      "Create a B2B SaaS product landing page with product headline, 3-column feature bento grid, 3 pricing tiers (Starter, Growth, Scale) with recommended highlight, FAQ accordion, and trial signup form.",
  },
  {
    id: "lead-optin",
    title: "Lead Magnet Opt-In",
    prompt:
      "Design a focused lead-generation squeeze page offering a free growth playbook / audit checklist, 4 bullet takeaways, authority bio, and a compact opt-in form.",
  },
] as const

const THEMES: Array<{ value: BuilderTheme; label: string }> = [
  { value: "clean-light", label: "Clean Light" },
  { value: "modern-dark", label: "Modern Dark" },
  { value: "bold-agency", label: "Bold Agency" },
  { value: "minimal", label: "Minimal" },
]

function isCraftJson(raw: string | null | undefined): boolean {
  if (!raw) return false
  const trimmed = raw.trim()
  if (!trimmed || trimmed === "{}" || trimmed.startsWith("<")) return false
  try {
    const parsed = JSON.parse(trimmed)
    return Boolean(parsed && typeof parsed === "object" && "ROOT" in parsed)
  } catch {
    return false
  }
}

function parseMeta(raw: string | null | undefined): StepConfigMeta {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === "object") return parsed
  } catch {}
  return {}
}

export function UnifiedWebsiteBuilder({
  initialSite,
  allSites = [],
  showSiteSwitcher = false,
  backHref = "/websites",
}: {
  initialSite: BuilderSite | null
  allSites?: BuilderSite[]
  showSiteSwitcher?: boolean
  backHref?: string
}) {
  const router = useRouter()

  const [sites, setSites] = useState<BuilderSite[]>(() => {
    if (allSites.length > 0) return allSites
    return initialSite ? [initialSite] : []
  })
  const [site, setSite] = useState<BuilderSite | null>(initialSite)
  const [activeStepId, setActiveStepId] = useState<string>(initialSite?.steps?.[0]?.id || "")

  const activeStep = useMemo(() => {
    if (!site?.steps?.length) return null
    return site.steps.find((s) => s.id === activeStepId) || site.steps[0]
  }, [site, activeStepId])

  const activeMeta = useMemo(() => parseMeta(activeStep?.config), [activeStep?.config])

  // Editor state synced from active step
  const [htmlDraft, setHtmlDraft] = useState<string>(activeStep?.content || "")
  const [siteNameDraft, setSiteNameDraft] = useState<string>(initialSite?.name || "")
  const [subdomainDraft, setSubdomainDraft] = useState<string>(initialSite?.subdomain || "")
  const [pageNameDraft, setPageNameDraft] = useState<string>(activeStep?.name || "Home")
  const [seoTitleDraft, setSeoTitleDraft] = useState<string>(activeMeta.seoTitle || "")
  const [seoDescDraft, setSeoDescDraft] = useState<string>(activeMeta.seoDescription || "")

  // UI state
  const [canvasTab, setCanvasTab] = useState<"preview" | "code" | "seo">("preview")
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop")
  const [theme, setTheme] = useState<BuilderTheme>("clean-light")
  const [aiMode, setAiMode] = useState<"generate" | "edit">(() => {
    const content = activeStep?.content || ""
    return content.trim() && !isCraftJson(content) ? "edit" : "generate"
  })
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  // Add page inline form
  const [addingPage, setAddingPage] = useState(false)
  const [newPageName, setNewPageName] = useState("")
  const [newPagePath, setNewPagePath] = useState("")

  // New site creation
  const [newSiteName, setNewSiteName] = useState("")
  const [creatingSite, setCreatingSite] = useState(false)
  const [showNewSiteForm, setShowNewSiteForm] = useState(false)

  // Voice input
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  const syncFromSite = (nextSite: BuilderSite, nextStepId?: string) => {
    setSite(nextSite)
    setSites((prev) => {
      const idx = prev.findIndex((s) => s.id === nextSite.id)
      if (idx === -1) return [nextSite, ...prev]
      const copy = [...prev]
      copy[idx] = nextSite
      return copy
    })
    const targetStep =
      (nextStepId && nextSite.steps.find((s) => s.id === nextStepId)) || nextSite.steps[0] || null
    setActiveStepId(targetStep?.id || "")
    const content = targetStep?.content || ""
    const meta = parseMeta(targetStep?.config)
    setHtmlDraft(content)
    setSiteNameDraft(nextSite.name)
    setSubdomainDraft(nextSite.subdomain || "")
    setPageNameDraft(targetStep?.name || "Home")
    setSeoTitleDraft(meta.seoTitle || "")
    setSeoDescDraft(meta.seoDescription || "")
    setAiMode(content.trim() && !isCraftJson(content) ? "edit" : "generate")
  }

  const selectStep = (step: BuilderStep) => {
    setActiveStepId(step.id)
    const content = step.content || ""
    const meta = parseMeta(step.config)
    setHtmlDraft(content)
    setPageNameDraft(step.name)
    setSeoTitleDraft(meta.seoTitle || "")
    setSeoDescDraft(meta.seoDescription || "")
    setAiMode(content.trim() && !isCraftJson(content) ? "edit" : "generate")
    setAiError(null)
  }

  const handleCreateNewSite = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const clean = newSiteName.trim() || "New AI Website"
    setCreatingSite(true)
    const res = await createFunnel(clean)
    setCreatingSite(false)
    if (res.success && res.data) {
      const created = res.data as BuilderSite
      syncFromSite(created)
      setShowNewSiteForm(false)
      setNewSiteName("")
      toast.success(`Created site "${created.name}"`)
      router.refresh()
    } else {
      toast.error(!res.success ? res.error : "Failed to create site")
    }
  }

  const handleSave = async (overrideContent?: string) => {
    if (!site || !activeStep) return
    setIsSaving(true)
    const contentToSave = overrideContent !== undefined ? overrideContent : htmlDraft

    const res = await updateFunnelStep(activeStep.id, {
      name: pageNameDraft,
      content: contentToSave,
      seoTitle: seoTitleDraft,
      seoDescription: seoDescDraft,
      saveHistory: true,
      historyLabel: "Manual Save",
    })

    if (res.success && res.data) {
      const updatedStep = res.data as BuilderStep
      const nextSite: BuilderSite = {
        ...site,
        steps: site.steps.map((s) => (s.id === updatedStep.id ? updatedStep : s)),
      }
      syncFromSite(nextSite, updatedStep.id)
      toast.success("Page saved!")
    } else {
      toast.error(!res.success ? res.error : "Failed to save page")
    }
    setIsSaving(false)
  }

  const handleSaveSiteSettings = async () => {
    if (!site || !activeStep) return
    setIsSaving(true)

    const metaRes = await updateFunnelMetadata(site.id, {
      name: siteNameDraft,
      subdomain: subdomainDraft,
    })

    if (!metaRes.success || !metaRes.data) {
      setIsSaving(false)
      toast.error(!metaRes.success ? metaRes.error : "Failed to update site settings")
      return
    }

    const stepRes = await updateFunnelStep(activeStep.id, {
      name: pageNameDraft,
      seoTitle: seoTitleDraft,
      seoDescription: seoDescDraft,
    })

    setIsSaving(false)
    if (stepRes.success && stepRes.data) {
      const updatedFunnel = metaRes.data as BuilderSite
      const updatedStep = stepRes.data as BuilderStep
      syncFromSite(
        {
          ...updatedFunnel,
          steps: updatedFunnel.steps.map((s) => (s.id === updatedStep.id ? updatedStep : s)),
        },
        updatedStep.id
      )
      toast.success("Site & SEO settings saved")
    } else {
      syncFromSite(metaRes.data as BuilderSite, activeStep.id)
      toast.success("Site settings saved")
    }
  }

  const handleTogglePublish = async () => {
    if (!site) return
    const isCurrentlyPublished =
      site.status.toLowerCase() === "published" || site.status.toLowerCase() === "active"
    const nextStatus = isCurrentlyPublished ? "draft" : "published"

    setIsTogglingStatus(true)
    const res = await updateFunnelMetadata(site.id, { status: nextStatus })
    setIsTogglingStatus(false)

    if (res.success && res.data) {
      syncFromSite(res.data as BuilderSite, activeStep?.id)
      toast.success(
        nextStatus === "published"
          ? "Site published live!"
          : "Site switched back to draft"
      )
    } else {
      toast.error(!res.success ? res.error : "Failed to update publish status")
    }
  }

  const handleAddPage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!site || !newPageName.trim()) return
    const pathInput =
      newPagePath.trim() ||
      `/${newPageName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}`

    const res = await addFunnelStep(site.id, {
      name: newPageName.trim(),
      path: pathInput,
    })

    if (res.success && res.data) {
      const createdStep = res.data as BuilderStep
      const nextSite: BuilderSite = {
        ...site,
        steps: [...site.steps, createdStep],
      }
      setAddingPage(false)
      setNewPageName("")
      setNewPagePath("")
      syncFromSite(nextSite, createdStep.id)
      toast.success(`Added page "${createdStep.name}"`)
    } else {
      toast.error(!res.success ? res.error : "Failed to add page")
    }
  }

  const handleDeletePage = async (step: BuilderStep) => {
    if (!site || site.steps.length <= 1) return
    const res = await deleteFunnelStep(site.id, step.id)
    if (res.success) {
      const remaining = site.steps.filter((s) => s.id !== step.id)
      syncFromSite({ ...site, steps: remaining }, remaining[0]?.id)
      toast.success(`Removed "${step.name}"`)
    } else {
      toast.error(!res.success ? res.error : "Failed to delete page")
    }
  }

  const handleAiGenerate = async (explicitPrompt?: string, forcedMode?: "generate" | "edit") => {
    if (!site || !activeStep) return
    const textPrompt = (explicitPrompt ?? prompt).trim()
    if (!textPrompt) {
      toast.error("Describe what you want AI to build or update")
      return
    }

    const modeToRun = forcedMode || aiMode
    setIsGenerating(true)
    setAiError(null)

    const res = await generateWebsitePageWithAi({
      stepId: activeStep.id,
      prompt: textPrompt,
      currentHtml: modeToRun === "edit" ? htmlDraft : undefined,
      mode: modeToRun,
      theme,
      siteName: site.name,
      pageName: activeStep.name,
      siblingPages: site.steps.map((s) => ({ name: s.name, path: s.path })),
    })

    setIsGenerating(false)

    if (res.success && res.data) {
      const updatedStep = (res.data.step as BuilderStep) || {
        ...activeStep,
        content: res.data.html,
      }
      const nextSite: BuilderSite = {
        ...site,
        steps: site.steps.map((s) => (s.id === updatedStep.id ? updatedStep : s)),
      }
      syncFromSite(nextSite, updatedStep.id)
      setCanvasTab("preview")
      if (!explicitPrompt) setPrompt("")
      toast.success(modeToRun === "edit" ? "Page refined & saved!" : "Page generated & saved!")
    } else {
      const errMsg = !res.success ? res.error : "AI generation failed"
      setAiError(errMsg)
      toast.error(errMsg)
    }
  }

  const handleRestoreVersion = async (entry: StepHistoryEntry) => {
    if (!activeStep || !site) return
    setIsSaving(true)
    const res = await updateFunnelStep(activeStep.id, {
      content: entry.content,
      saveHistory: true,
      historyLabel: `Restored (${entry.label})`,
    })
    setIsSaving(false)
    if (res.success && res.data) {
      const updatedStep = res.data as BuilderStep
      syncFromSite(
        {
          ...site,
          steps: site.steps.map((s) => (s.id === updatedStep.id ? updatedStep : s)),
        },
        updatedStep.id
      )
      setCanvasTab("preview")
      toast.success("Restored version & saved to database")
    } else {
      toast.error(!res.success ? res.error : "Failed to restore version")
    }
  }

  const toggleVoice = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRec) {
      toast.error("Speech recognition is not supported in this browser")
      return
    }
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }
    const rec = new SpeechRec()
    rec.lang = "en-US"
    rec.continuous = false
    rec.onresult = (e: any) => {
      const transcript = e.results?.[0]?.[0]?.transcript
      if (transcript) {
        setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript))
        toast.success("Voice captured!")
      }
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    rec.start()
    recognitionRef.current = rec
    setListening(true)
  }

  // Empty workspace view when no sites exist (e.g. first visit to /forge)
  if (!site) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-bg-primary border border-border rounded-2xl p-8 text-center space-y-5 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">AI Website & Funnel Studio</h1>
            <p className="text-sm text-text-secondary mt-1">
              Create multi-page websites, refine layouts with AI, capture CRM leads automatically, and publish live in one click.
            </p>
          </div>
          <form onSubmit={handleCreateNewSite} className="space-y-3 text-left">
            <label className="text-xs font-medium text-text-secondary uppercase">Site or Funnel Name</label>
            <Input
              value={newSiteName}
              onChange={(e) => setNewSiteName(e.target.value)}
              placeholder="e.g. Agency Growth Landing Page"
              required
            />
            <Button type="submit" disabled={creatingSite} className="w-full">
              {creatingSite ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Create Website
            </Button>
          </form>
        </div>
      </div>
    )
  }

  const isPublished =
    site.status.toLowerCase() === "published" || site.status.toLowerCase() === "active"
  const liveHref = site.subdomain
    ? activeStep?.path && activeStep.path !== "/"
      ? `/f/${site.subdomain}${activeStep.path}`
      : `/f/${site.subdomain}`
    : null
  const legacyCraft = isCraftJson(htmlDraft)
  const hasHtml = htmlDraft.trim() !== "" && htmlDraft.trim() !== "{}" && !legacyCraft
  const historyList = [...(activeMeta.history || [])].reverse()

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] -m-4 sm:-m-6 bg-bg-secondary overflow-hidden">
      {/* Top Toolbar */}
      <header className="h-14 border-b border-border bg-bg-primary px-4 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={backHref}>
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>

          {showSiteSwitcher && sites.length > 0 ? (
            <div className="flex items-center gap-2">
              <select
                value={site.id}
                onChange={(e) => {
                  const found = sites.find((s) => s.id === e.target.value)
                  if (found) syncFromSite(found)
                }}
                className="h-8 px-2.5 rounded-lg bg-bg-secondary border border-border text-sm font-semibold text-text-primary max-w-[220px]"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setShowNewSiteForm((v) => !v)}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> New Site
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-sm text-text-primary truncate">{site.name}</span>
              <Badge variant={isPublished ? "success" : "secondary"} className="text-[10px] capitalize">
                {site.status.toLowerCase()}
              </Badge>
            </div>
          )}
        </div>

        {/* Center Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex bg-bg-secondary p-0.5 rounded-lg border border-border text-xs">
            <button
              type="button"
              onClick={() => setCanvasTab("preview")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                canvasTab === "preview" ? "bg-bg-primary text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
            <button
              type="button"
              onClick={() => setCanvasTab("code")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                canvasTab === "code" ? "bg-bg-primary text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" /> HTML Code
            </button>
            <button
              type="button"
              onClick={() => setCanvasTab("seo")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                canvasTab === "seo" ? "bg-bg-primary text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" /> SEO & History
            </button>
          </div>

          {canvasTab === "preview" && (
            <div className="hidden md:flex bg-bg-secondary p-0.5 rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setViewport("desktop")}
                title="Desktop"
                className={`p-1.5 rounded ${viewport === "desktop" ? "bg-bg-primary text-primary shadow-sm" : "text-text-secondary"}`}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewport("tablet")}
                title="Tablet"
                className={`p-1.5 rounded ${viewport === "tablet" ? "bg-bg-primary text-primary shadow-sm" : "text-text-secondary"}`}
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewport("mobile")}
                title="Mobile"
                className={`p-1.5 rounded ${viewport === "mobile" ? "bg-bg-primary text-primary shadow-sm" : "text-text-secondary"}`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {liveHref && isPublished && (
            <a
              href={liveHref}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-border text-text-secondary hover:text-primary hover:border-primary/50"
            >
              View Live <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSave()}
            disabled={isSaving || !activeStep}
            className="h-8 text-xs"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
            Save
          </Button>
          <Button
            size="sm"
            onClick={handleTogglePublish}
            disabled={isTogglingStatus}
            variant={isPublished ? "secondary" : "default"}
            className="h-8 text-xs gap-1.5"
          >
            {isTogglingStatus ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Globe className="w-3.5 h-3.5" />
            )}
            {isPublished ? "Unpublish" : "Publish Live"}
          </Button>
        </div>
      </header>

      {/* Inline New Site Bar (Forge Mode) */}
      {showNewSiteForm && (
        <form
          onSubmit={handleCreateNewSite}
          className="bg-bg-primary border-b border-border px-4 py-2.5 flex items-center gap-2 shrink-0"
        >
          <Input
            value={newSiteName}
            onChange={(e) => setNewSiteName(e.target.value)}
            placeholder="New site name (e.g. Q4 Product Launch)"
            className="h-8 text-xs max-w-xs"
            autoFocus
          />
          <Button type="submit" size="sm" className="h-8 text-xs" disabled={creatingSite}>
            Create
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 text-xs"
            onClick={() => setShowNewSiteForm(false)}
          >
            Cancel
          </Button>
        </form>
      )}

      {/* Main Workspace */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Panel: Pages + AI Copilot */}
        <aside className="w-[340px] lg:w-[370px] border-r border-border bg-bg-primary flex flex-col shrink-0 min-h-0">
          {/* Pages List */}
          <div className="p-3.5 border-b border-border space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Pages ({site.steps.length})
              </span>
              <button
                type="button"
                onClick={() => setAddingPage((v) => !v)}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
              >
                <FilePlus2 className="w-3.5 h-3.5" /> Add Page
              </button>
            </div>

            {addingPage && (
              <form onSubmit={handleAddPage} className="p-2.5 rounded-lg bg-bg-secondary border border-border space-y-2">
                <Input
                  value={newPageName}
                  onChange={(e) => setNewPageName(e.target.value)}
                  placeholder="Page name (e.g. Pricing)"
                  className="h-8 text-xs"
                  required
                />
                <Input
                  value={newPagePath}
                  onChange={(e) => setNewPagePath(e.target.value)}
                  placeholder="Path (e.g. /pricing)"
                  className="h-8 text-xs font-mono"
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" className="h-7 text-xs flex-1">
                    Add
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => setAddingPage(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-1 max-h-36 overflow-y-auto">
              {site.steps.map((s) => (
                <div
                  key={s.id}
                  onClick={() => selectStep(s)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                    activeStep?.id === s.id
                      ? "bg-primary/10 text-primary font-semibold border border-primary/25"
                      : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="truncate">{s.name}</span>
                    <span className="font-mono text-[10px] opacity-70">{s.path}</span>
                  </div>
                  {site.steps.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeletePage(s)
                      }}
                      title="Delete page"
                      className="p-1 rounded hover:text-error opacity-60 hover:opacity-100"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* AI Studio */}
          <div className="flex-1 flex flex-col p-3.5 gap-3 overflow-y-auto min-h-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> AI Website Copilot
              </span>
              <div className="flex bg-bg-secondary p-0.5 rounded-md border border-border text-[11px]">
                <button
                  type="button"
                  onClick={() => setAiMode("generate")}
                  className={`px-2 py-0.5 rounded font-medium ${
                    aiMode === "generate" ? "bg-primary text-white" : "text-text-secondary"
                  }`}
                >
                  Generate
                </button>
                <button
                  type="button"
                  onClick={() => setAiMode("edit")}
                  disabled={!hasHtml}
                  className={`px-2 py-0.5 rounded font-medium disabled:opacity-40 ${
                    aiMode === "edit" ? "bg-primary text-white" : "text-text-secondary"
                  }`}
                >
                  Refine
                </button>
              </div>
            </div>

            {/* Theme selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-text-secondary">Visual Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as BuilderTheme)}
                className="w-full h-8 px-2.5 rounded-lg bg-bg-secondary border border-border text-xs text-text-primary"
              >
                {THEMES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Starter Templates */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-text-secondary">Starter Prompts</label>
              <div className="grid grid-cols-2 gap-1.5">
                {STARTER_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    disabled={isGenerating}
                    onClick={() => {
                      setPrompt(tpl.prompt)
                      setAiMode("generate")
                    }}
                    className="p-2 rounded-lg border border-border bg-bg-secondary/60 hover:border-primary/50 text-left text-[11px] font-medium text-text-primary truncate transition-colors"
                    title={tpl.prompt}
                  >
                    ✦ {tpl.title}
                  </button>
                ))}
              </div>
            </div>

            {aiError && (
              <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs text-amber-400 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> AI Unavailable
                </div>
                <p className="text-[11px] leading-snug">{aiError}</p>
                <Link href="/settings/ai" className="text-[11px] underline font-medium inline-block">
                  Configure AI Keys →
                </Link>
              </div>
            )}

            <div className="flex-1 flex flex-col gap-2 min-h-[140px]">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-text-secondary">
                  {aiMode === "edit" ? "Refinement Instruction" : "Page Prompt"}
                </label>
                <button
                  type="button"
                  onClick={toggleVoice}
                  title="Voice input"
                  className={`p-1 rounded border text-xs ${
                    listening ? "border-error text-error animate-pulse" : "border-border text-text-secondary hover:text-primary"
                  }`}
                >
                  {listening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                </button>
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault()
                    handleAiGenerate()
                  }
                }}
                placeholder={
                  aiMode === "edit"
                    ? 'e.g. "Change hero CTA to Book a Demo, make the pricing section 3 columns, and add a customer FAQ"'
                    : 'e.g. "Build a landing page for an architectural design studio with portfolio highlights and lead form"'
                }
                className="flex-1 min-h-[110px] resize-none rounded-lg bg-bg-secondary border border-border p-2.5 text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40"
              />

              <Button
                type="button"
                onClick={() => handleAiGenerate()}
                disabled={isGenerating || !prompt.trim()}
                className="w-full text-xs font-medium"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    {aiMode === "edit" ? "Refining Page..." : "Generating Page..."}
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                    {aiMode === "edit" ? "Apply AI Refinement" : "Generate Page with AI"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </aside>

        {/* Right Workspace: Preview / Code / SEO & History */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden bg-bg-secondary/60 p-4">
          {canvasTab === "preview" && (
            <div className="flex-1 flex flex-col items-center min-h-0">
              <div
                className={`flex-1 bg-white rounded-xl border border-border shadow-md overflow-hidden transition-all w-full flex flex-col ${
                  viewport === "tablet"
                    ? "max-w-[768px]"
                    : viewport === "mobile"
                      ? "max-w-[390px]"
                      : "max-w-full"
                }`}
              >
                {/* URL bar */}
                <div className="h-8 bg-slate-100 border-b border-slate-200 px-3 flex items-center gap-2 shrink-0">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 text-center text-[11px] font-mono text-slate-500 truncate">
                    {liveHref || `/f/${site.subdomain || site.id}`}
                  </div>
                </div>

                {legacyCraft ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-800 space-y-4">
                    <div className="p-3 rounded-full bg-amber-100 text-amber-700">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold">Legacy Block Page Format</h3>
                    <p className="text-sm text-slate-600 max-w-md">
                      This page uses legacy Craft.js JSON blocks. It still renders cleanly on your live URL, or you can generate modern responsive HTML for this page using AI on the left.
                    </p>
                    <div className="flex gap-2">
                      {liveHref && isPublished && (
                        <a href={liveHref} target="_blank" rel="noreferrer">
                          <Button variant="outline" size="sm">Open Live View</Button>
                        </a>
                      )}
                      <Button
                        size="sm"
                        onClick={() => {
                          setAiMode("generate")
                          setCanvasTab("code")
                        }}
                      >
                        Inspect Raw Data
                      </Button>
                    </div>
                  </div>
                ) : hasHtml ? (
                  <iframe
                    srcDoc={htmlDraft}
                    sandbox="allow-scripts"
                    className="w-full flex-1 border-0 bg-white"
                    title="website-builder-preview"
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-700 space-y-3">
                    <Sparkles className="w-10 h-10 text-primary/40" />
                    <h3 className="text-lg font-semibold">Blank Page: {activeStep?.name}</h3>
                    <p className="text-sm text-slate-500 max-w-md">
                      Pick a starter prompt or describe your ideal page in the AI Website Copilot on the left to generate responsive HTML & lead capture forms.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {canvasTab === "code" && (
            <div className="flex-1 flex flex-col bg-bg-primary rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border flex items-center justify-between bg-bg-secondary/40">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  HTML Source — {activeStep?.name} ({activeStep?.path})
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(htmlDraft)
                      setCopiedCode(true)
                      toast.success("HTML copied")
                      setTimeout(() => setCopiedCode(false), 1800)
                    }}
                  >
                    {copiedCode ? <Check className="w-3 h-3 mr-1 text-emerald-500" /> : <Copy className="w-3 h-3 mr-1" />}
                    {copiedCode ? "Copied" : "Copy HTML"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={isSaving}
                    onClick={() => handleSave(htmlDraft)}
                  >
                    Apply & Save HTML
                  </Button>
                </div>
              </div>
              <textarea
                value={htmlDraft}
                onChange={(e) => setHtmlDraft(e.target.value)}
                spellCheck={false}
                placeholder="<!DOCTYPE html>..."
                className="flex-1 w-full p-4 bg-bg-primary text-xs font-mono text-text-primary focus:outline-none resize-none leading-relaxed"
              />
            </div>
          )}

          {canvasTab === "seo" && (
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
              {/* Site & Page SEO Settings */}
              <div className="bg-bg-primary border border-border rounded-xl p-5 space-y-4">
                <h3 className="font-semibold text-sm text-text-primary flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-primary" /> Site & Page SEO Settings
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-text-secondary block mb-1">Site Name</label>
                    <Input value={siteNameDraft} onChange={(e) => setSiteNameDraft(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-secondary block mb-1">Public Subdomain Slug</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-text-secondary">/f/</span>
                      <Input
                        value={subdomainDraft}
                        onChange={(e) => setSubdomainDraft(e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <hr className="border-border" />
                  <div>
                    <label className="text-xs font-medium text-text-secondary block mb-1">Active Page Name</label>
                    <Input value={pageNameDraft} onChange={(e) => setPageNameDraft(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-secondary block mb-1">SEO Meta Title</label>
                    <Input
                      value={seoTitleDraft}
                      onChange={(e) => setSeoTitleDraft(e.target.value)}
                      placeholder="e.g. Acme Growth Agency | Scale Your Pipeline"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-secondary block mb-1">SEO Meta Description</label>
                    <textarea
                      rows={3}
                      value={seoDescDraft}
                      onChange={(e) => setSeoDescDraft(e.target.value)}
                      placeholder="Concise search engine summary..."
                      className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <Button onClick={handleSaveSiteSettings} disabled={isSaving} className="w-full text-xs">
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                    Save Settings & SEO
                  </Button>
                </div>
              </div>

              {/* Version History */}
              <div className="bg-bg-primary border border-border rounded-xl p-5 space-y-4">
                <h3 className="font-semibold text-sm text-text-primary flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" /> Page Version History ({historyList.length})
                </h3>
                {historyList.length === 0 ? (
                  <p className="text-xs text-text-secondary py-6 text-center">
                    No saved checkpoints yet for this page. Each AI generation or manual save creates a restorable snapshot automatically.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {historyList.map((entry, idx) => (
                      <div
                        key={`${entry.savedAt}-${idx}`}
                        className="p-3 rounded-lg border border-border bg-bg-secondary/40 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-text-primary truncate">{entry.label}</p>
                          <p className="text-[11px] text-text-secondary font-mono">
                            {new Date(entry.savedAt).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isSaving}
                          onClick={() => handleRestoreVersion(entry)}
                          className="h-7 text-xs shrink-0 gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Restore
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
