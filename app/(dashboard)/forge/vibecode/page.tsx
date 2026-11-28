"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { savePromptTemplate } from "@/app/actions/prompts"
import {
  generateWebsitePageWithAi,
  getFunnels,
  publishVibecodeToFunnel,
  type BuilderTheme,
} from "@/app/actions/funnels"
import { VIBECODE_PROMPTS } from "@/lib/vibecode-prompts"
import { toast } from "sonner"
import {
  Code2,
  Copy,
  Save,
  Play,
  Loader2,
  CheckCheck,
  Mic,
  MicOff,
  Rocket,
  ExternalLink,
  Eye,
  Monitor,
  Tablet,
  Smartphone,
  RotateCcw,
  Wand2,
} from "lucide-react"

const CATEGORIES = ["Landing Pages", "CRM Widgets", "Email Templates", "Automations", "Forms", "Voice AI"]

const THEMES: Array<{ value: BuilderTheme; label: string }> = [
  { value: "clean-light", label: "Clean Light" },
  { value: "modern-dark", label: "Modern Dark" },
  { value: "bold-agency", label: "Bold Agency" },
  { value: "minimal", label: "Minimal" },
]

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

function VibecodeLabInner() {
  const searchParams = useSearchParams()
  const initialPrompt = searchParams.get("prompt") || ""

  const [prompt, setPrompt] = useState(initialPrompt)
  const [generatedCode, setGeneratedCode] = useState("")
  const [theme, setTheme] = useState<BuilderTheme>("clean-light")
  const [aiMode, setAiMode] = useState<"generate" | "edit">("generate")
  const [rightTab, setRightTab] = useState<"preview" | "code">("preview")
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop")

  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [listening, setListening] = useState(false)

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt)
    }
  }, [initialPrompt])

  // Save modal state
  const [saveOpen, setSaveOpen] = useState(false)
  const [saveName, setSaveName] = useState("")
  const [saveCategory, setSaveCategory] = useState("Landing Pages")
  const [saving, setSaving] = useState(false)

  // Publish modal state
  const [publishOpen, setPublishOpen] = useState(false)
  const [publishTarget, setPublishTarget] = useState<"new" | "existing">("new")
  const [existingSites, setExistingSites] = useState<Array<{ id: string; name: string; subdomain: string | null }>>([])
  const [selectedSiteId, setSelectedSiteId] = useState("")
  const [funnelName, setFunnelName] = useState("AI Landing Page")
  const [publishing, setPublishing] = useState(false)
  const [publishedResult, setPublishedResult] = useState<{ liveUrl: string; funnelId: string } | null>(null)

  const recognitionRef = useRef<any>(null)

  const openPublishModal = async () => {
    setPublishedResult(null)
    setPublishOpen(true)
    const res = await getFunnels()
    if (res.success && Array.isArray(res.data)) {
      setExistingSites(res.data)
      if (res.data.length > 0 && !selectedSiteId) {
        setSelectedSiteId(res.data[0].id)
      }
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    const effectiveMode = aiMode === "edit" && generatedCode.trim() ? "edit" : "generate"

    setLoading(true)
    setPublishedResult(null)

    try {
      const res = await generateWebsitePageWithAi({
        prompt,
        currentHtml: effectiveMode === "edit" ? generatedCode : undefined,
        mode: effectiveMode,
        theme,
        siteName: funnelName || "AI Landing Page",
        pageName: "Home",
      })

      if (res.success && res.data?.html) {
        setGeneratedCode(res.data.html)
        setAiMode("edit")
        setRightTab("preview")
        if (effectiveMode === "edit") setPrompt("")
        toast.success(effectiveMode === "edit" ? "Page updated!" : "Page generated!")
      } else {
        toast.error(!res.success ? res.error : "Generation failed — check your AI settings")
      }
    } catch {
      toast.error("Failed to generate code")
    }
    setLoading(false)
  }

  const handleReset = () => {
    setGeneratedCode("")
    setAiMode("generate")
    setPublishedResult(null)
    setRightTab("preview")
  }

  const handleCopy = () => {
    if (!generatedCode) return
    navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    toast.success("Copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleVoice = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRec) {
      toast.error("Speech recognition not supported in this browser")
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
    rec.interimResults = false
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      setPrompt((prev) => (prev ? prev + " " + transcript : transcript))
      toast.success("Voice captured!")
    }
    rec.onerror = () => {
      toast.error("Voice recognition error")
      setListening(false)
    }
    rec.onend = () => setListening(false)
    rec.start()
    recognitionRef.current = rec
    setListening(true)
  }

  const handleSave = async () => {
    if (!saveName.trim()) {
      toast.error("Template name is required")
      return
    }
    if (!prompt.trim()) {
      toast.error("Prompt is empty")
      return
    }
    setSaving(true)
    const res = await savePromptTemplate({ name: saveName, category: saveCategory, prompt })
    setSaving(false)
    if (res.success) {
      toast.success("Prompt saved to your library!")
      setSaveOpen(false)
      setSaveName("")
    } else {
      toast.error(res.error)
    }
  }

  const handlePublishFunnel = async () => {
    if (!generatedCode) return
    setPublishing(true)
    const res = await publishVibecodeToFunnel({
      name: publishTarget === "new" ? funnelName : "",
      htmlContent: generatedCode,
      existingFunnelId: publishTarget === "existing" ? selectedSiteId : undefined,
    })
    setPublishing(false)

    if (res.success && res.data) {
      setPublishedResult({
        liveUrl: res.data.liveUrl,
        funnelId: res.data.funnelId,
      })
      toast.success(`Published live to Funnel: ${res.data.subdomain}!`)
    } else {
      toast.error(!res.success ? res.error : "Failed to publish funnel")
    }
  }

  return (
    <div className="h-[calc(100vh-9rem)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Code2 className="w-6 h-6 text-primary" />
            Vibecode Lab
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Generate, iteratively refine with AI or raw HTML, and publish or update live sites with CRM lead capture.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/forge"
            className="text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-primary hover:border-primary/50"
          >
            Open Multi-Page Studio →
          </Link>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-text-secondary">
            <kbd className="px-1.5 py-0.5 rounded bg-bg-secondary border border-border font-mono">⌘</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-bg-secondary border border-border font-mono">Enter</kbd>
            <span>to run</span>
          </div>
        </div>
      </div>

      {/* Starter Prompts */}
      <div className="flex flex-wrap gap-2 flex-shrink-0">
        {VIBECODE_PROMPTS.slice(0, 5).map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setPrompt(p.prompt)
              setAiMode("generate")
            }}
            className="text-xs px-3 py-1.5 rounded-full border border-border text-text-secondary hover:text-primary hover:border-primary/50 bg-bg-primary transition-colors max-w-xs truncate"
            title={p.prompt}
          >
            ✦ {p.title}
          </button>
        ))}
      </div>

      {/* Split Screen */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        {/* Left — Prompt Pad */}
        <div className="flex flex-col gap-3 bg-bg-primary border border-border rounded-xl p-4 min-h-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex bg-bg-secondary p-0.5 rounded-lg border border-border text-xs">
                <button
                  type="button"
                  onClick={() => setAiMode("generate")}
                  className={`px-2.5 py-1 rounded-md font-medium ${
                    aiMode === "generate" ? "bg-primary text-white" : "text-text-secondary"
                  }`}
                >
                  New
                </button>
                <button
                  type="button"
                  disabled={!generatedCode}
                  onClick={() => setAiMode("edit")}
                  className={`px-2.5 py-1 rounded-md font-medium disabled:opacity-40 ${
                    aiMode === "edit" ? "bg-primary text-white" : "text-text-secondary"
                  }`}
                >
                  Refine Current
                </button>
              </div>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as BuilderTheme)}
                className="h-7 px-2 rounded-lg bg-bg-secondary border border-border text-xs text-text-primary"
              >
                {THEMES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleVoice}
                title="Voice input"
                className={`p-1.5 rounded-lg border transition-colors ${
                  listening
                    ? "border-error text-error animate-pulse"
                    : "border-border text-text-secondary hover:text-primary hover:border-primary/50"
                }`}
              >
                {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
              {generatedCode && (
                <>
                  <button
                    onClick={handleReset}
                    title="Start fresh"
                    className="p-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setSaveOpen(true)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-border text-text-secondary hover:text-primary hover:border-primary/50 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </button>
                  <button
                    onClick={openPublishModal}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    <Rocket className="w-3.5 h-3.5" />
                    Publish
                  </button>
                </>
              )}
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary text-white font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : aiMode === "edit" && generatedCode ? (
                  <Wand2 className="w-3.5 h-3.5" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                {loading ? "Working…" : aiMode === "edit" && generatedCode ? "Refine" : "Generate"}
              </button>
            </div>
          </div>

          {/* Prompt Textarea */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleGenerate()
            }}
            placeholder={
              aiMode === "edit" && generatedCode
                ? 'Describe edits to apply to the current HTML (e.g. "Add a 3-tier pricing comparison and change button color to emerald")'
                : 'Describe what you want to build...\n\ne.g. "Build a high-converting B2B SaaS landing page with hero section, pricing tiers, and lead capture form."'
            }
            className="flex-1 resize-none bg-bg-secondary rounded-lg p-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono leading-relaxed min-h-0"
          />
        </div>

        {/* Right — Preview or Full Editable HTML Code */}
        <div className="flex flex-col gap-3 bg-bg-primary border border-border rounded-xl p-4 min-h-0">
          <div className="flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex bg-bg-secondary p-0.5 rounded-lg border border-border text-xs">
                <button
                  type="button"
                  onClick={() => setRightTab("preview")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium ${
                    rightTab === "preview" ? "bg-bg-primary text-text-primary shadow-sm" : "text-text-secondary"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <button
                  type="button"
                  onClick={() => setRightTab("code")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium ${
                    rightTab === "code" ? "bg-bg-primary text-text-primary shadow-sm" : "text-text-secondary"
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" /> Full HTML Code
                </button>
              </div>

              {rightTab === "preview" && (
                <div className="flex bg-bg-secondary p-0.5 rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => setViewport("desktop")}
                    title="Desktop"
                    className={`p-1 rounded ${viewport === "desktop" ? "bg-bg-primary text-primary" : "text-text-secondary"}`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewport("tablet")}
                    title="Tablet"
                    className={`p-1 rounded ${viewport === "tablet" ? "bg-bg-primary text-primary" : "text-text-secondary"}`}
                  >
                    <Tablet className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewport("mobile")}
                    title="Mobile"
                    className={`p-1 rounded ${viewport === "mobile" ? "bg-bg-primary text-primary" : "text-text-secondary"}`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {generatedCode && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary transition-colors"
              >
                {copied ? <CheckCheck className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy HTML"}
              </button>
            )}
          </div>

          <div className="flex-1 rounded-lg overflow-hidden border border-border bg-bg-secondary/30 min-h-0 flex justify-center">
            {rightTab === "code" ? (
              <textarea
                value={generatedCode}
                onChange={(e) => setGeneratedCode(e.target.value)}
                spellCheck={false}
                placeholder="Generated HTML will appear here — you can also paste or edit HTML directly."
                className="w-full h-full p-3 bg-bg-primary text-xs font-mono text-text-primary focus:outline-none resize-none leading-relaxed"
              />
            ) : !generatedCode ? (
              <div className="h-full flex flex-col items-center justify-center text-text-secondary gap-3">
                <Code2 className="w-10 h-10 opacity-20" />
                <p className="text-sm font-medium">Preview appears here</p>
                <p className="text-xs opacity-60">Choose a theme, describe a page, and click Generate</p>
              </div>
            ) : (
              <div
                className={`h-full w-full bg-white transition-all overflow-hidden ${
                  viewport === "tablet"
                    ? "max-w-[768px] border-x border-border"
                    : viewport === "mobile"
                      ? "max-w-[390px] border-x border-border"
                      : "max-w-full"
                }`}
              >
                <iframe
                  srcDoc={generatedCode}
                  className="w-full h-full border-0"
                  title="vibecode-preview"
                  sandbox="allow-scripts"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {saveOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-bg-primary border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-text-primary mb-1">Save Prompt Template</h3>
            <p className="text-sm text-text-secondary mb-5">Save this prompt to your reusable library</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text-primary mb-1.5 block">Template Name</label>
                <input
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="e.g. Clean Agency Hero Section"
                  className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary mb-1.5 block">Category</label>
                <select
                  value={saveCategory}
                  onChange={(e) => setSaveCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSaveOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !saveName.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
              >
                {saving ? "Saving…" : "Save to Library"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish to Funnel Modal */}
      {publishOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-bg-primary border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <Rocket className="w-5 h-5 text-emerald-500" />
              Publish Live Site
            </h3>
            <p className="text-xs text-text-secondary">
              Deploy as a brand-new live page or update an existing website/funnel in place.
            </p>

            {publishedResult ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl space-y-3">
                <p className="text-xs font-semibold text-emerald-500">
                  Page is live and connected to CRM lead capture!
                </p>
                <div className="flex items-center justify-between bg-bg-primary p-2.5 rounded-lg border border-border text-xs font-mono">
                  <span className="truncate">{publishedResult.liveUrl}</span>
                  <a
                    href={publishedResult.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 flex-shrink-0 ml-2"
                  >
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex gap-2">
                  <Link href={`/funnels/${publishedResult.funnelId}`} className="flex-1">
                    <button className="w-full py-2 border border-border rounded-lg text-xs font-medium hover:bg-bg-secondary">
                      Open in Studio
                    </button>
                  </Link>
                  <button
                    onClick={() => setPublishOpen(false)}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                {existingSites.length > 0 && (
                  <div className="flex bg-bg-secondary p-1 rounded-lg border border-border text-xs">
                    <button
                      type="button"
                      onClick={() => setPublishTarget("new")}
                      className={`flex-1 py-1.5 rounded-md font-medium ${
                        publishTarget === "new" ? "bg-bg-primary text-text-primary shadow-sm" : "text-text-secondary"
                      }`}
                    >
                      New Site
                    </button>
                    <button
                      type="button"
                      onClick={() => setPublishTarget("existing")}
                      className={`flex-1 py-1.5 rounded-md font-medium ${
                        publishTarget === "existing" ? "bg-bg-primary text-text-primary shadow-sm" : "text-text-secondary"
                      }`}
                    >
                      Update Existing Site
                    </button>
                  </div>
                )}

                {publishTarget === "new" ? (
                  <div>
                    <label className="text-xs font-medium text-text-secondary block mb-1.5">Site Name</label>
                    <input
                      value={funnelName}
                      onChange={(e) => setFunnelName(e.target.value)}
                      placeholder="e.g. Agency Growth Landing Page"
                      className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-medium text-text-secondary block mb-1.5">Select Site to Update</label>
                    <select
                      value={selectedSiteId}
                      onChange={(e) => setSelectedSiteId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border text-sm text-text-primary"
                    >
                      {existingSites.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.subdomain || s.id})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setPublishOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePublishFunnel}
                    disabled={
                      publishing ||
                      (publishTarget === "new" ? !funnelName.trim() : !selectedSiteId)
                    }
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-40 shadow-sm flex items-center justify-center gap-2"
                  >
                    {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                    {publishing ? "Publishing…" : publishTarget === "existing" ? "Update Live Site" : "Publish Now"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function VibecodePage() {
  return (
    <Suspense>
      <VibecodeLabInner />
    </Suspense>
  )
}
