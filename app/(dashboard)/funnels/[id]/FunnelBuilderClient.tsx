"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Save, Sparkles, Type, Square, Image as ImageIcon, MousePointerClick, Send, Loader2, Copy, Check } from "lucide-react"
import { Editor, Frame, Element, useNode, useEditor } from "@craftjs/core"
import { updateFunnelStepContent } from "@/app/actions/funnels"
import { generateAiReply } from "@/app/actions/ai"
import { toast } from "sonner"

/* --- CRAFT.JS COMPONENTS --- */

// 1. Container Component
const ContainerComponent = ({ children, padding = 20, background = "#ffffff" }: any) => {
  const { connectors: { connect, drag }, selected } = useNode((node) => ({
    selected: node.events.selected,
  }));
  return (
    <div 
      ref={(ref: any) => connect(drag(ref))} 
      style={{ padding: `${padding}px`, backgroundColor: background }}
      className={`min-h-[100px] w-full transition-all ${selected ? 'border-2 border-primary' : 'border border-dashed border-border'}`}
    >
      {children}
    </div>
  )
}
ContainerComponent.craft = {
  props: { padding: 20, background: "#ffffff" },
  rules: { canDrag: () => true },
}

// 2. Text Component
const TextComponent = ({ text, fontSize = 16, textAlign = "left", color = "#000000" }: any) => {
  const { connectors: { connect, drag }, selected } = useNode((node) => ({
    selected: node.events.selected,
  }));
  return (
    <div 
      ref={(ref: any) => connect(drag(ref))} 
      style={{ fontSize: `${fontSize}px`, textAlign, color }}
      className={`p-2 ${selected ? 'border-2 border-primary' : ''}`}
    >
      {text}
    </div>
  )
}
TextComponent.craft = {
  props: { text: "Double click to edit", fontSize: 16, textAlign: "left", color: "#000000" },
  rules: { canDrag: () => true },
}

// 3. Button Component
const ButtonComponent = ({ text = "Click Me", variant = "default" }: any) => {
  const { connectors: { connect, drag }, selected } = useNode((node) => ({
    selected: node.events.selected,
  }));
  return (
    <div ref={(ref: any) => connect(drag(ref))} className={`inline-block p-2 ${selected ? 'border-2 border-primary' : ''}`}>
      <Button variant={variant}>{text}</Button>
    </div>
  )
}
ButtonComponent.craft = {
  props: { text: "Click Me", variant: "default" },
  rules: { canDrag: () => true },
}

// 4. Image Component
const ImageComponent = ({ src = "https://via.placeholder.com/400x200" }: any) => {
  const { connectors: { connect, drag }, selected } = useNode((node) => ({
    selected: node.events.selected,
  }));
  return (
    <div ref={(ref: any) => connect(drag(ref))} className={`p-2 ${selected ? 'border-2 border-primary' : ''}`}>
      <img src={src} alt="Builder Image" className="w-full h-auto rounded-lg" />
    </div>
  )
}
ImageComponent.craft = {
  props: { src: "https://via.placeholder.com/400x200" },
  rules: { canDrag: () => true },
}

/* --- SIDEBAR COMPONENTS --- */

const Toolbox = () => {
  const { connectors, query } = useEditor();

  return (
    <div className="w-64 bg-bg-primary border-r border-border flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-sm">Elements</h3>
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center h-20 gap-2 cursor-grab"
            ref={(ref: any) => connectors.create(ref, <Element is={ContainerComponent} canvas />)}
          >
            <Square className="w-5 h-5 text-text-secondary" />
            <span className="text-xs">Container</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center h-20 gap-2 cursor-grab"
            ref={(ref: any) => connectors.create(ref, <TextComponent text="New Text Block" fontSize={24} />)}
          >
            <Type className="w-5 h-5 text-text-secondary" />
            <span className="text-xs">Text</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center h-20 gap-2 cursor-grab"
            ref={(ref: any) => connectors.create(ref, <ButtonComponent text="Call to Action" />)}
          >
            <MousePointerClick className="w-5 h-5 text-text-secondary" />
            <span className="text-xs">Button</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center h-20 gap-2 cursor-grab"
            ref={(ref: any) => connectors.create(ref, <ImageComponent />)}
          >
            <ImageIcon className="w-5 h-5 text-text-secondary" />
            <span className="text-xs">Image</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

const AICopilot = ({ aiSettings }: { aiSettings: any[] }) => {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [history, setHistory] = useState<Array<{ role: "user" | "ai"; content: string }>>(
    [{ role: "ai", content: "👋 I'm your AI Web Copilot. Describe a section you want me to build, and I'll generate content for it!" }]
  )
  const [copied, setCopied] = useState(false)
  const { actions, query } = useEditor()

  // Generate a list of available models for the dropdown based on what the user has configured
  const availableModels = []
  
  // Always offer a default Google one as fallback, but prefer configured ones
  if (aiSettings?.length === 0) {
    availableModels.push({ value: "", label: "Default AI Model" })
  } else {
    aiSettings.forEach(s => {
      availableModels.push({ value: `${s.provider}:${s.modelName}`, label: `${s.provider.toUpperCase()} (${s.modelName})` })
    })
  }

  const handleGenerate = async () => {
    if (!prompt || isGenerating) return
    const userPrompt = prompt
    setPrompt("")
    setHistory(h => [...h, { role: "user", content: userPrompt }])
    setIsGenerating(true)

    try {
      const res = await generateAiReply("landing_page", userPrompt, selectedModel)
      const aiText = res?.success && res.data ? res.data : "Here's some copy for your section. Drag elements from the left panel to build it out!"
      setHistory(h => [...h, { role: "ai", content: aiText }])
    } catch {
      toast.error("AI generation failed. Please try again.")
      setHistory(h => [...h, { role: "ai", content: "Sorry, I couldn't generate content right now. Please try again." }])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Copied to clipboard!")
  }

  return (
    <div className="w-80 bg-bg-primary border-l border-border flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-sm flex items-center gap-2 text-primary">
            <Sparkles className="w-4 h-4" /> AI Copilot
          </h3>
        </div>
        {availableModels.length > 0 && (
          <select 
            className="w-full text-xs p-1 mt-1 border rounded bg-white text-text-secondary outline-none"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            <option value="">Default AI Model</option>
            {availableModels.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {history.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "ai" ? (
              <div className="relative group bg-bg-secondary p-3 rounded-lg border border-border text-sm text-text-secondary w-[90%]">
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <button
                  onClick={() => handleCopy(msg.content)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-border"
                >
                  {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-text-secondary" />}
                </button>
              </div>
            ) : (
              <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-2 rounded-md max-w-[85%]">{msg.content}</span>
            )}
          </div>
        ))}
        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-bg-secondary p-3 rounded-lg border border-border text-sm text-text-secondary">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-bg-secondary">
        <div className="relative">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., A pricing table with 3 tiers..."
            className="pr-10"
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleGenerate()}
            disabled={isGenerating}
          />
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 text-primary"
            onClick={handleGenerate}
            disabled={isGenerating || !prompt}
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

const Topbar = ({ funnel, isSaving, setIsSaving }: any) => {
  const { query } = useEditor()

  const handleSave = async () => {
    if (!funnel.steps?.[0]) return
    setIsSaving(true)
    const json = query.serialize()
    await updateFunnelStepContent(funnel.steps[0].id, json)
    setIsSaving(false)
  }

  return (
    <header className="h-14 border-b border-border bg-bg-primary flex items-center justify-between px-4 shrink-0 z-10 relative">
      <div className="flex items-center gap-4">
        <Link href="/funnels">
          <Button variant="ghost" size="icon" className="w-8 h-8"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div className="h-4 w-px bg-border"></div>
        <div>
          <span className="font-semibold text-sm">{funnel.name}</span>
          <span className="ml-2 text-xs text-text-secondary bg-bg-secondary px-2 py-1 rounded">AI Builder</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" /> {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </header>
  )
}

export default function FunnelBuilderClient({ funnel, aiSettings = [] }: { funnel: any, aiSettings?: any[] }) {
  const [isSaving, setIsSaving] = useState(false)
  
  const step = funnel.steps?.[0]
  const hasContent = step?.content && step.content !== "{}"

  return (
    <div className="flex flex-col h-screen -m-8">
      <Editor resolver={{ ContainerComponent, TextComponent, ButtonComponent, ImageComponent }}>
        <Topbar funnel={funnel} isSaving={isSaving} setIsSaving={setIsSaving} />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbox */}
        <Toolbox />

        {/* Main Canvas Area */}
        <div className="flex-1 bg-bg-secondary p-8 overflow-auto flex justify-center">
          <div className="w-full max-w-5xl min-h-[800px] bg-white shadow-2xl rounded-lg overflow-hidden border border-border flex flex-col">
            {/* Browser Mockup Header */}
            <div className="bg-slate-100 border-b border-slate-200 p-2 flex items-center gap-2 shrink-0">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <div className="ml-4 flex-1">
                <div className="bg-white rounded-md h-6 w-full max-w-sm border border-slate-200 mx-auto flex items-center px-2 text-[10px] text-slate-400 font-mono">
                  https://{funnel.subdomain || "your-site"}.nexlin.com
                </div>
              </div>
            </div>
            
            <div className="flex-1 bg-white overflow-y-auto">
              {hasContent ? (
                <Frame data={step.content} />
              ) : (
                <Frame>
                  <Element is={ContainerComponent} padding={40} background="#ffffff" canvas>
                    <TextComponent text="Start Building Your AI Website" fontSize={36} textAlign="center" />
                    <TextComponent text="Drag elements from the left, or use the AI Copilot on the right to generate entire sections instantly." fontSize={18} textAlign="center" color="#666666" />
                    <div className="flex justify-center mt-8">
                      <ButtonComponent text="Get Started" variant="default" />
                    </div>
                  </Element>
                </Frame>
              )}
            </div>
          </div>
        </div>

        {/* Right AI Copilot Panel */}
        <AICopilot aiSettings={aiSettings} />
      </div>
      </Editor>
    </div>
  )
}
