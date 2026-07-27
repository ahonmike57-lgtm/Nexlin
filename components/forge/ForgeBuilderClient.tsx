"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Sparkles, Send, RefreshCw, Eye, Globe, Layers, GitBranch, ShieldCheck, 
  RotateCcw, ExternalLink, CheckCircle2, Loader2, FileCode 
} from "lucide-react"

import { createForgeSite, generateForgePageFromPrompt, updateForgeSectionPrompt } from "@/app/actions/forge-builder"
import { DEALERSHIP_SEED_TEMPLATES } from "@/lib/forge/dealership-templates"
import { ForgeFunnelCanvas } from "./ForgeFunnelCanvas"
import { toast } from "sonner"

export function ForgeBuilderClient({ initialSite, initialPage }: { initialSite?: any; initialPage?: any }) {
  const [site, setSite] = useState<any>(initialSite || null)
  const [page, setPage] = useState<any>(initialPage || null)
  const [promptInput, setPromptInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<"builder" | "funnel">("builder")

  // Streamed component sections
  const [sections, setSections] = useState<any[]>(
    initialPage?.componentTree ? JSON.parse(initialPage.componentTree) : []
  )

  // Version checkpoint tracking
  const [history, setHistory] = useState<any[]>([])

  const handleGenerate = async (explicitPrompt?: string) => {
    const textPrompt = explicitPrompt || promptInput
    if (!textPrompt.trim()) return

    setIsGenerating(true)
    try {
      // Checkpoint current state for 1-click revert
      if (sections.length > 0 && page) {
        setHistory(prev => [...prev, { version: page.version || 1, sections }])
      }

      const res = await generateForgePageFromPrompt(page?.id, textPrompt, "dealership")
      if (res.success && res.sections) {
        setSections(res.sections)
        if (res.page) setPage(res.page)
        if (res.site) setSite(res.site)
        toast.success("Page sections streamed & generated!")
        setPromptInput("")
      } else {
        toast.error(res.error || "Generation failed")
      }
    } catch (err: any) {
      toast.error("Generation error: " + err.message)
    }
    setIsGenerating(false)
  }

  const handleScopedEdit = async (sectionId: string) => {
    const editPrompt = window.prompt("Scoped section edit prompt (e.g. 'make this section dark' or 'shorten title'):")
    if (!editPrompt || !page) return

    setIsGenerating(true)
    const res = await updateForgeSectionPrompt(page.id, sectionId, editPrompt)
    if (res.success && res.sections) {
      setSections(res.sections)
      toast.success("Section updated!")
    } else {
      toast.error(res.error || "Update failed")
    }
    setIsGenerating(false)
  }

  const handleRevert = () => {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setSections(prev.sections)
    setHistory(history.slice(0, -1))
    toast.success(`Reverted to Checkpoint Version ${prev.version}`)
  }

  return (
    <div className="h-full flex flex-col bg-[#090d16] text-text-primary overflow-hidden font-sans">
      {/* Top Navbar */}
      <header className="h-16 border-b border-border bg-[#090d16] flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#1A3CFF] to-blue-700 flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight font-display text-white flex items-center gap-2">
              NEXLIN Forge <Badge className="bg-[#F5A623] text-black font-semibold text-[10px]">AI Builder</Badge>
            </h1>
            <p className="text-[11px] text-text-secondary">
              {site?.domain ? `Domain: ${site.domain}` : "Conversational Prompt-to-Build Engine"}
            </p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex bg-bg-secondary p-1 rounded-lg border border-border text-xs">
            <button
              onClick={() => setActiveTab("builder")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${activeTab === 'builder' ? 'bg-[#1A3CFF] text-white shadow' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Prompt Canvas
            </button>
            <button
              onClick={() => setActiveTab("funnel")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${activeTab === 'funnel' ? 'bg-[#1A3CFF] text-white shadow' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Funnel Mapper
            </button>
          </div>

          {history.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleRevert} className="text-xs">
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Revert
            </Button>
          )}

          <Button size="sm" className="bg-[#1A3CFF] hover:bg-[#1A3CFF]/90 text-white gap-2">
            <Globe className="w-4 h-4" /> Publish Live
          </Button>
        </div>
      </header>

      {/* Main Content View */}
      {activeTab === "funnel" ? (
        <div className="p-8 overflow-y-auto max-w-6xl mx-auto w-full">
          <ForgeFunnelCanvas />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Panel - Prompt Chat & Seed Templates */}
          <div className="w-[420px] flex-shrink-0 border-r border-border bg-[#0b101d] flex flex-col">
            <div className="p-4 border-b border-border space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Dealership Starter Templates
              </h2>

              <div className="grid grid-cols-2 gap-2">
                {DEALERSHIP_SEED_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => handleGenerate(tmpl.prompt)}
                    disabled={isGenerating}
                    className="p-2.5 rounded-lg border border-border bg-[#0f172a] hover:border-[#1A3CFF] text-left text-xs transition-colors space-y-1"
                  >
                    <div className="font-semibold text-white truncate">{tmpl.title}</div>
                    <div className="text-[10px] text-text-secondary line-clamp-2">{tmpl.tagline}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Console */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <div className="p-3.5 rounded-xl border border-[#1A3CFF]/30 bg-[#1A3CFF]/5 text-xs text-text-secondary space-y-2">
                <div className="font-semibold text-[#1A3CFF] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Conversational Prompt Engine
                </div>
                <p>Describe your website or funnel in plain English. Forge routes layout, copywriting, and SEO across Sonnet & GPT-4 models.</p>
              </div>

              {sections.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-text-secondary uppercase">Page Component Sections</div>
                  {sections.map((sec, idx) => (
                    <div 
                      key={sec.id}
                      onClick={() => handleScopedEdit(sec.id)}
                      className="p-2.5 rounded-lg border border-border bg-[#0f172a] flex items-center justify-between text-xs cursor-pointer hover:border-[#F5A623]/60 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[#F5A623]">0{idx + 1}</span>
                        <span className="capitalize font-medium text-white">{sec.type.replace("_", " ")}</span>
                      </div>
                      <span className="text-[10px] text-text-secondary">Click to edit</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prompt Input Box */}
            <div className="p-4 border-t border-border bg-[#090d16]">
              <form 
                onSubmit={(e) => {
                  e.preventDefault()
                  handleGenerate()
                }}
                className="space-y-2"
              >
                <textarea
                  className="w-full h-24 p-3 text-xs bg-[#0f172a] border border-border rounded-xl focus:outline-none focus:border-[#1A3CFF] text-white placeholder:text-text-secondary resize-none"
                  placeholder="e.g. Add a trade-in estimator section with a VIN lookup and instant trade offer CTA..."
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                />
                <Button 
                  type="submit" 
                  disabled={isGenerating || !promptInput.trim()} 
                  className="w-full bg-[#1A3CFF] hover:bg-[#1A3CFF]/90 text-white font-medium"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2 text-[#F5A623]" />}
                  {isGenerating ? "Streaming Sections..." : "Generate Site Section"}
                </Button>
              </form>
            </div>
          </div>

          {/* Right Panel - Live Preview Canvas with Gold Streaming Pulse Signature */}
          <div className="flex-1 bg-[#050811] p-6 overflow-y-auto flex flex-col items-center">
            {sections.length === 0 ? (
              <div className="my-auto text-center space-y-4 max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-[#1A3CFF]/10 border border-[#1A3CFF]/30 flex items-center justify-center mx-auto text-[#1A3CFF]">
                  <Layers className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-xl font-display text-white">Your Forge Canvas is Empty</h3>
                  <p className="text-xs text-text-secondary mt-1">
                    Select a Dealership seed template on the left or type a prompt to stream your first website section.
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-4xl space-y-6">
                {sections.map((sec) => (
                  <div
                    key={sec.id}
                    className={`relative rounded-2xl border bg-[#0b101d] p-8 transition-all duration-500 ${
                      sec.isStreamingNew 
                        ? 'border-[#F5A623] shadow-[0_0_20px_rgba(245,166,35,0.3)] animate-pulse' 
                        : 'border-border/60 hover:border-border'
                    }`}
                  >
                    {/* Signature Gold Outline Badge */}
                    {sec.isStreamingNew && (
                      <span className="absolute -top-3 left-6 bg-[#F5A623] text-black font-extrabold text-[9px] uppercase px-2.5 py-0.5 rounded-full shadow">
                        ✨ Streamed Section
                      </span>
                    )}

                    {sec.type === "hero" && (
                      <div className="text-center max-w-2xl mx-auto space-y-4">
                        <Badge className="bg-[#1A3CFF]/20 text-[#1A3CFF] border-[#1A3CFF]/40 text-xs">Rodriguez Auto Sales</Badge>
                        <h2 className="text-4xl font-extrabold font-display text-white tracking-tight">{sec.title}</h2>
                        <p className="text-sm text-text-secondary">{sec.subtitle}</p>
                        <Button size="lg" className="bg-[#1A3CFF] hover:bg-[#1A3CFF]/90 text-white font-bold rounded-xl px-8">
                          {sec.ctaText}
                        </Button>
                      </div>
                    )}

                    {sec.type === "inventory_showcase" && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold font-display text-white text-center">{sec.title}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {(sec.items || []).map((item: any, i: number) => (
                            <div key={i} className="p-4 rounded-xl bg-[#0f172a] border border-border space-y-2">
                              <Badge className="bg-[#F5A623]/20 text-[#F5A623] text-[10px]">{item.badge}</Badge>
                              <h4 className="font-semibold text-sm text-white">{item.name}</h4>
                              <div className="flex justify-between items-center text-xs text-text-secondary font-mono">
                                <span>{item.mileage}</span>
                                <span className="font-bold text-white">{item.price}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {sec.type === "lead_form" && (
                      <div className="max-w-md mx-auto space-y-4 p-6 rounded-xl bg-[#0f172a] border border-border">
                        <div className="text-center">
                          <h3 className="font-bold text-lg text-white">{sec.title}</h3>
                          <p className="text-xs text-text-secondary">{sec.subtitle}</p>
                        </div>

                        <form 
                          onSubmit={async (e) => {
                            e.preventDefault()
                            const formData = new FormData(e.currentTarget)
                            const fullName = formData.get("fullName") as string
                            const email = formData.get("email") as string
                            const phone = formData.get("phone") as string
                            const monthlyIncome = formData.get("monthlyIncome") as string

                            const res = await fetch("/api/forge/submit", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ siteId: site?.id, fullName, email, phone, monthlyIncome, formName: sec.title })
                            })
                            const data = await res.json()
                            if (data.success) {
                              toast.success(data.message)
                            } else {
                              toast.error(data.error || "Submission failed")
                            }
                          }}
                          className="space-y-3"
                        >
                          {(sec.fields || []).map((f: any) => (
                            <div key={f.name} className="space-y-1">
                              <label className="text-xs text-text-secondary">{f.label}</label>
                              {f.type === "select" ? (
                                <select name={f.name} className="w-full p-2 bg-[#090d16] border border-border rounded-lg text-xs text-white">
                                  {(f.options || []).map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              ) : (
                                <Input name={f.name} type={f.type} placeholder={f.label} required={f.required} className="bg-[#090d16] text-xs text-white border-border" />
                              )}
                            </div>
                          ))}

                          <Button type="submit" className="w-full bg-[#1A3CFF] hover:bg-[#1A3CFF]/90 text-white font-bold">
                            {sec.buttonText || "Submit Lead Application"}
                          </Button>
                        </form>
                      </div>
                    )}

                    {sec.type === "testimonials" && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold font-display text-white text-center">{sec.title}</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {(sec.reviews || []).map((rev: any, i: number) => (
                            <div key={i} className="p-4 rounded-xl bg-[#0f172a] border border-border space-y-2">
                              <p className="text-xs text-text-secondary italic">"{rev.comment}"</p>
                              <div className="text-xs font-semibold text-white">— {rev.name}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
