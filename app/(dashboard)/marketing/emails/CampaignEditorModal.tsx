"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  X, Sparkles, Bold, Italic, Link, List, Eye, FileText,
  Send, Save, Loader2, ChevronDown
} from "lucide-react"
import { updateCampaign, sendCampaign } from "@/app/actions/marketing"
import { generateAiReply } from "@/app/actions/ai"
import { toast } from "sonner"

interface Campaign {
  id: string
  name: string
  subject: string
  content: string
  status: string
}

interface CampaignEditorModalProps {
  campaign: Campaign
  onClose: () => void
  onSaved: () => void
}

export default function CampaignEditorModal({ campaign, onClose, onSaved }: CampaignEditorModalProps) {
  const [name, setName] = useState(campaign.name)
  const [subject, setSubject] = useState(campaign.subject || "")
  const [fromName, setFromName] = useState("Your Agency")
  const [body, setBody] = useState(campaign.content === "{}" ? "" : campaign.content)
  const [activeView, setActiveView] = useState<"edit" | "preview">("edit")
  const [isSaving, setIsSaving] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertFormat = (before: string, after: string = "") => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = body.substring(start, end)
    const newText = body.substring(0, start) + before + selected + after + body.substring(end)
    setBody(newText)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + before.length, start + before.length + selected.length)
    }, 0)
  }

  const handleAiGenerate = async () => {
    if (!subject) {
      toast.error("Please enter a subject line first so AI knows what to write about.")
      return
    }
    setIsGenerating(true)
    const res = await generateAiReply("marketing", `Write a high-converting marketing email for the subject: "${subject}". Include a greeting, value proposition, call to action, and sign-off. Use HTML paragraph tags (<p>) for formatting.`)
    if (res.success && res.data) {
      setBody(res.data)
      toast.success("AI draft generated!")
    } else {
      toast.error(res.error || "AI generation failed")
    }
    setIsGenerating(false)
  }

  const handleSaveDraft = async () => {
    setIsSaving(true)
    const res = await updateCampaign(campaign.id, { name, subject, content: body, status: "draft" })
    if (res.success) {
      toast.success("Campaign saved as draft!")
      onSaved()
      onClose()
    } else {
      toast.error(res.error || "Failed to save")
    }
    setIsSaving(false)
  }

  const handleSendNow = async () => {
    setShowConfirm(false)
    setIsSending(true)
    // Save first, then send
    await updateCampaign(campaign.id, { name, subject, content: body, status: "draft" })
    const res = await sendCampaign(campaign.id)
    if (res.success) {
      toast.success(res.mock ? "Campaign sent (mock mode — add RESEND_API_KEY to go live)!" : `Campaign sent to ${(res as any).count} contacts!`)
      onSaved()
      onClose()
    } else {
      toast.error(res.error || "Failed to send campaign")
    }
    setIsSending(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-primary rounded-2xl shadow-2xl border border-border w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="font-semibold text-text-primary bg-transparent border-none outline-none focus:bg-bg-secondary px-1 rounded text-sm w-48"
              />
              <p className="text-xs text-text-secondary">Campaign Editor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={campaign.status === "active" ? "success" : "secondary"}>{campaign.status}</Badge>
            <Button variant="ghost" size="icon" onClick={onClose} className="w-8 h-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Editor */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
            {/* From / Subject */}
            <div className="px-6 py-4 space-y-3 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-text-secondary w-16 shrink-0">From</span>
                <input
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  className="flex-1 text-sm bg-bg-secondary border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Your Agency Name"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-text-secondary w-16 shrink-0">Subject</span>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="flex-1 text-sm bg-bg-secondary border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Your compelling subject line..."
                />
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-bg-secondary shrink-0">
              <button
                onClick={() => insertFormat("**", "**")}
                className="p-1.5 rounded hover:bg-bg-primary transition-colors text-text-secondary hover:text-text-primary"
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() => insertFormat("*", "*")}
                className="p-1.5 rounded hover:bg-bg-primary transition-colors text-text-secondary hover:text-text-primary"
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                onClick={() => insertFormat("[", "](https://)")}
                className="p-1.5 rounded hover:bg-bg-primary transition-colors text-text-secondary hover:text-text-primary"
                title="Link"
              >
                <Link className="w-4 h-4" />
              </button>
              <button
                onClick={() => insertFormat("\n- ")}
                className="p-1.5 rounded hover:bg-bg-primary transition-colors text-text-secondary hover:text-text-primary"
                title="Bullet list"
              >
                <List className="w-4 h-4" />
              </button>
              <div className="mx-1 w-px h-4 bg-border" />
              <button
                onClick={handleAiGenerate}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {isGenerating ? "Generating..." : "AI Write"}
              </button>
              <div className="ml-auto flex border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setActiveView("edit")}
                  className={`px-3 py-1 text-xs font-medium flex items-center gap-1 transition-colors ${activeView === "edit" ? "bg-primary text-white" : "text-text-secondary hover:text-text-primary"}`}
                >
                  <FileText className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={() => setActiveView("preview")}
                  className={`px-3 py-1 text-xs font-medium flex items-center gap-1 transition-colors ${activeView === "preview" ? "bg-primary text-white" : "text-text-secondary hover:text-text-primary"}`}
                >
                  <Eye className="w-3 h-3" /> Preview
                </button>
              </div>
            </div>

            {/* Body */}
            {activeView === "edit" ? (
              <textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your email body here... Use the toolbar above to format, or click 'AI Write' to generate it automatically."
                className="flex-1 p-6 text-sm bg-bg-primary text-text-primary resize-none focus:outline-none font-mono leading-relaxed"
              />
            ) : (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-lg mx-auto bg-white text-gray-800 rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-white">
                    <p className="text-xs opacity-80 mb-1">From: {fromName}</p>
                    <h2 className="text-xl font-bold">{subject || "(No subject)"}</h2>
                  </div>
                  <div
                    className="p-6 text-sm leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: body.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>") || "<p class='text-gray-400'>Your email body will appear here...</p>" }}
                  />
                  <div className="px-6 pb-6">
                    <a href="#" className="inline-block bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-lg">
                      Click Here →
                    </a>
                  </div>
                  <div className="px-6 py-4 border-t border-gray-100 text-xs text-gray-400">
                    <p>You received this email because you opted in. <a href="#" className="underline">Unsubscribe</a></p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-bg-secondary shrink-0">
          <p className="text-xs text-text-secondary">
            {body.length} characters · {body.split(/\s+/).filter(Boolean).length} words
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving || isSending}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Draft
            </Button>
            {showConfirm ? (
              <div className="flex items-center gap-2 bg-error/10 border border-error/30 rounded-lg px-3 py-1.5">
                <span className="text-xs text-error font-medium">Send to all contacts?</span>
                <Button size="sm" onClick={handleSendNow} disabled={isSending} className="h-7 text-xs">
                  {isSending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirm"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowConfirm(false)} className="h-7 text-xs">Cancel</Button>
              </div>
            ) : (
              <Button onClick={() => setShowConfirm(true)} disabled={isSending || !subject}>
                <Send className="w-4 h-4 mr-2" />
                Send Now
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
