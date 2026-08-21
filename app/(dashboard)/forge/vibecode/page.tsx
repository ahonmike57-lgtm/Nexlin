"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { generateAiReply } from "@/app/actions/ai"
import { savePromptTemplate } from "@/app/actions/prompts"
import { publishVibecodeToFunnel } from "@/app/actions/funnels"
import { VIBECODE_PROMPTS } from "@/lib/vibecode-prompts"
import { toast } from "sonner"
import {
  Code2, Copy, Save, Play, Loader2, Sparkles, CheckCheck, Mic, MicOff, Rocket, ExternalLink
} from "lucide-react"

const CATEGORIES = ["Landing Pages", "CRM Widgets", "Email Templates", "Automations", "Forms", "Voice AI"]

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

  // Publish to Funnel state
  const [publishOpen, setPublishOpen] = useState(false)
  const [funnelName, setFunnelName] = useState("AI Landing Page")
  const [publishing, setPublishing] = useState(false)
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setGeneratedCode("")
    setPublishedUrl(null)
    try {
      const res = await generateAiReply(
        "",
        `You are an expert frontend developer who generates beautiful, self-contained HTML+CSS code.

User request: "${prompt}"

STRICT RULES:
1. Return ONLY raw HTML — no markdown fences, no explanations, no comments outside the HTML.
2. Always start with <!DOCTYPE html>
3. Include <script src="https://cdn.tailwindcss.com"></script> in the <head>.
4. Use dark mode colors: background #0f172a, primary #6366f1, text #f8fafc.
5. Make the UI visually polished with rounded corners, shadows, and smooth hover transitions.
6. The HTML must be entirely self-contained and renderable in a sandboxed iframe.`
      )

      if (res.success && res.data) {
        let code = res.data
          .replace(/```html\n?/gi, "")
          .replace(/```\n?/g, "")
          .trim()

        if (!code.toLowerCase().startsWith("<!doctype")) {
          code = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-white min-h-screen p-8">
${code}
</body>
</html>`
        }

        setGeneratedCode(code)
        toast.success("Code generated!")
      } else {
        toast.error("Generation failed — check your AI settings")
      }
    } catch {
      toast.error("Failed to generate code")
    }
    setLoading(false)
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
    if (!saveName.trim()) { toast.error("Template name is required"); return }
    if (!prompt.trim()) { toast.error("Prompt is empty"); return }
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
      name: funnelName,
      htmlContent: generatedCode,
    })
    setPublishing(false)

    if (res.success && res.data) {
      setPublishedUrl(res.data.liveUrl)
      toast.success(`Published live to Funnel: ${res.data.subdomain}!`)
    } else {
      toast.error('error' in res ? res.error : "Failed to publish funnel")
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
            Describe a UI component or landing page — AI generates and deploys it live in seconds.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <kbd className="px-1.5 py-0.5 rounded bg-bg-secondary border border-border font-mono">⌘</kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-bg-secondary border border-border font-mono">Enter</kbd>
          <span>to generate</span>
        </div>
      </div>

      {/* Starter Prompts */}
      <div className="flex flex-wrap gap-2 flex-shrink-0">
        {VIBECODE_PROMPTS.slice(0, 5).map((p) => (
          <button
            key={p.id}
            onClick={() => setPrompt(p.prompt)}
            className="text-xs px-3 py-1.5 rounded-full border border-border text-text-secondary hover:text-primary hover:border-primary/50 bg-bg-primary transition-colors max-w-xs truncate"
            title={p.prompt}
          >
            ✦ {p.title}
          </button>
        ))}
      </div>

      {/* Split Screen */}
      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        {/* Left — Prompt Pad */}
        <div className="flex flex-col gap-3 bg-bg-primary border border-border rounded-xl p-4 min-h-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between flex-shrink-0">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Prompt</span>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleVoice}
                title="Voice input"
                className={`p-1.5 rounded-lg border transition-colors ${listening ? "border-error text-error animate-pulse" : "border-border text-text-secondary hover:text-primary hover:border-primary/50"}`}
              >
                {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
              {generatedCode && (
                <>
                  <button
                    onClick={() => setSaveOpen(true)}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-border text-text-secondary hover:text-primary hover:border-primary/50 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setPublishedUrl(null)
                      setPublishOpen(true)
                    }}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    <Rocket className="w-3.5 h-3.5" />
                    Publish to Funnel
                  </button>
                </>
              )}
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary text-white font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                {loading ? "Generating…" : "Generate"}
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
            placeholder={`Describe what you want to build...\n\ne.g. "Build a high-converting B2B SaaS landing page with dark mode, hero section, pricing tiers, and contact lead capture form."`}
            className="flex-1 resize-none bg-bg-secondary rounded-lg p-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono leading-relaxed min-h-0"
          />

          {/* Code Preview */}
          {generatedCode && (
            <div className="flex-shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Output Code</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary transition-colors"
                >
                  {copied ? <CheckCheck className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied!" : "Copy All"}
                </button>
              </div>
              <pre className="text-[11px] bg-bg-secondary rounded-lg p-3 overflow-auto max-h-36 font-mono text-text-secondary whitespace-pre-wrap leading-relaxed">
                {generatedCode.substring(0, 600)}
                {generatedCode.length > 600 ? "\n…" : ""}
              </pre>
            </div>
          )}
        </div>

        {/* Right — Live Preview */}
        <div className="flex flex-col gap-3 bg-bg-primary border border-border rounded-xl p-4 min-h-0">
          <div className="flex items-center justify-between flex-shrink-0">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Live Preview</span>
            {generatedCode && (
              <span className="text-xs text-success font-medium flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Rendered
              </span>
            )}
          </div>
          <div className="flex-1 rounded-lg overflow-hidden border border-border bg-white min-h-0">
            {!generatedCode ? (
              <div className="h-full flex flex-col items-center justify-center text-text-secondary gap-3 bg-bg-secondary/30">
                <Sparkles className="w-10 h-10 opacity-20" />
                <p className="text-sm font-medium">Preview appears here</p>
                <p className="text-xs opacity-60">Type a prompt → click Generate</p>
              </div>
            ) : (
              <iframe
                srcDoc={generatedCode}
                className="w-full h-full"
                title="vibecode-preview"
                sandbox="allow-scripts allow-same-origin"
              />
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
                  placeholder="e.g. Dark SaaS Hero Section"
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
              Publish to Live Funnel
            </h3>
            <p className="text-xs text-text-secondary">
              Deploy this generated landing page instantly to a live funnel URL.
            </p>

            {publishedUrl ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl space-y-3">
                <p className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
                  🎉 Page is live and accessible on the web!
                </p>
                <div className="flex items-center justify-between bg-bg-primary p-2.5 rounded-lg border border-border text-xs font-mono">
                  <span className="truncate">{publishedUrl}</span>
                  <a
                    href={publishedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 flex-shrink-0 ml-2"
                  >
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <button
                  onClick={() => setPublishOpen(false)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1.5">Funnel Page Name</label>
                  <input
                    value={funnelName}
                    onChange={(e) => setFunnelName(e.target.value)}
                    placeholder="e.g. Acme Dental Landing Page"
                    className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setPublishOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePublishFunnel}
                    disabled={publishing || !funnelName.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-40 shadow-sm flex items-center justify-center gap-2"
                  >
                    {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                    {publishing ? "Publishing…" : "Publish Now"}
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



